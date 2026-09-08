<?php
header('Content-Type: application/json');
require_once '../cors.php';

require_once '../db.php';
require_once '../security.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
secure_session_start();

function currentUser(): ?array
{
    $user = $_SESSION['user'] ?? null;
    if (!$user || empty($user['isLoggedIn'])) {
        return null;
    }

    return $user;
}

function isAdmin(?array $user): bool
{
    return $user && ($user['type'] ?? '') === 'admin';
}

function requireAuthenticatedUser(?array $user): void
{
    if ($user) {
        return;
    }

    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

function requireFanUser(?array $user): void
{
    requireAuthenticatedUser($user);
    if (($user['type'] ?? '') !== 'fan') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only fan accounts can follow artists']);
        exit;
    }
}

function artistExists(PDO $pdo, int $artistId): bool
{
    $stmt = $pdo->prepare("SELECT id FROM artists WHERE id = ? LIMIT 1");
    $stmt->execute([$artistId]);
    return (bool) $stmt->fetchColumn();
}

function syncArtistFollowerCount(PDO $pdo, int $artistId): void
{
    $stmt = $pdo->prepare("UPDATE artists SET followers = (SELECT COUNT(*) FROM follows WHERE artist_id = ?) WHERE id = ?");
    $stmt->execute([$artistId, $artistId]);
}

function getArtistOwner(PDO $pdo, int $artistId): ?array
{
    $stmt = $pdo->prepare("SELECT id, user_id, name FROM artists WHERE id = ? LIMIT 1");
    $stmt->execute([$artistId]);
    $artist = $stmt->fetch();
    return $artist ?: null;
}

function createArtistNotification(PDO $pdo, int $artistUserId, string $message, int $targetArtistId): void
{
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, target_id, is_read) VALUES (?, ?, 'follow', ?, 0)");
    $stmt->execute([$artistUserId, $message, $targetArtistId]);
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        try {
            $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
            $artistId = isset($_GET['artist_id']) ? (int) $_GET['artist_id'] : 0;

            if ($userId > 0 && $artistId > 0) {
                requireAuthenticatedUser($sessionUser);
                if (!isAdmin($sessionUser) && (int) ($sessionUser['id'] ?? 0) !== $userId) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    break;
                }

                $stmt = $pdo->prepare("SELECT id FROM follows WHERE user_id = ? AND artist_id = ?");
                $stmt->execute([$userId, $artistId]);
                $follow = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => ['is_following' => $follow !== false]]);
            } elseif ($userId > 0) {
                requireAuthenticatedUser($sessionUser);
                if (!isAdmin($sessionUser) && (int) ($sessionUser['id'] ?? 0) !== $userId) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    break;
                }

                $stmt = $pdo->prepare("
                    SELECT f.*, a.name as artist_name, a.genre, a.followers, a.bio, a.status
                    FROM follows f
                    JOIN artists a ON f.artist_id = a.id
                    WHERE f.user_id = ?
                    ORDER BY f.created_at DESC
                ");
                $stmt->execute([$userId]);
                $follows = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $follows]);
            } elseif ($artistId > 0) {
                $stmt = $pdo->prepare("
                    SELECT f.id, f.user_id, f.artist_id, f.created_at, u.name as user_name
                    FROM follows f
                    JOIN users u ON f.user_id = u.id
                    WHERE f.artist_id = ?
                    ORDER BY f.created_at DESC
                ");
                $stmt->execute([$artistId]);
                $followers = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $followers]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'user_id or artist_id is required']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        requireFanUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $artistId = (int) ($data['artist_id'] ?? 0);
        $userId = (int) ($sessionUser['id'] ?? 0);

        if ($artistId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'artist_id is required']);
            exit;
        }

        try {
            $artist = getArtistOwner($pdo, $artistId);
            if (!$artist) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Artist not found']);
                break;
            }

            $stmt = $pdo->prepare("SELECT id FROM follows WHERE user_id = ? AND artist_id = ?");
            $stmt->execute([$userId, $artistId]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Already following this artist']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO follows (user_id, artist_id) VALUES (?, ?)");
            $stmt->execute([$userId, $artistId]);
            syncArtistFollowerCount($pdo, $artistId);
            if (!empty($artist['user_id']) && (int) $artist['user_id'] !== $userId) {
                $fanName = $sessionUser['name'] ?? 'A new fan';
                createArtistNotification($pdo, (int) $artist['user_id'], $fanName . ' started following you', (int) $artist['id']);
            }

            echo json_encode(['success' => true, 'message' => 'Successfully followed artist']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        requireFanUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $artistId = (int) ($data['artist_id'] ?? ($_GET['artist_id'] ?? 0));
        $userId = (int) ($sessionUser['id'] ?? 0);

        if ($artistId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'artist_id is required']);
            exit;
        }

        try {
            $artist = getArtistOwner($pdo, $artistId);
            if (!$artist) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Artist not found']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM follows WHERE user_id = ? AND artist_id = ?");
            $stmt->execute([$userId, $artistId]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Follow relationship not found']);
            } else {
                syncArtistFollowerCount($pdo, $artistId);
                if (!empty($artist['user_id']) && (int) $artist['user_id'] !== $userId) {
                    $fanName = $sessionUser['name'] ?? 'A user';
                    createArtistNotification($pdo, (int) $artist['user_id'], $fanName . ' unfollowed you', (int) $artist['id']);
                }
                echo json_encode(['success' => true, 'message' => 'Successfully unfollowed artist']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
