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

function syncSongLikes(PDO $pdo, int $songId): void
{
    $stmt = $pdo->prepare("UPDATE songs SET likes = (SELECT COUNT(*) FROM user_likes WHERE song_id = ?) WHERE id = ?");
    $stmt->execute([$songId, $songId]);
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        requireAuthenticatedUser($sessionUser);

        try {
            $requestedUserId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
            $songId = isset($_GET['song_id']) ? (int) $_GET['song_id'] : 0;
            $effectiveUserId = (int) ($sessionUser['id'] ?? 0);

            if ($requestedUserId > 0 && !isAdmin($sessionUser) && $requestedUserId !== $effectiveUserId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            if (isAdmin($sessionUser) && $requestedUserId > 0) {
                $effectiveUserId = $requestedUserId;
            }

            if ($songId > 0) {
                $stmt = $pdo->prepare("SELECT id FROM user_likes WHERE user_id = ? AND song_id = ?");
                $stmt->execute([$effectiveUserId, $songId]);
                $like = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => ['is_favorited' => $like !== false]]);
            } else {
                $stmt = $pdo->prepare("
                    SELECT ul.*, s.title, s.genre, s.duration, s.plays, s.likes, s.file_path, s.cover_art,
                           a.name AS artist_name, a.id AS artist_id
                    FROM user_likes ul
                    JOIN songs s ON ul.song_id = s.id
                    LEFT JOIN artists a ON s.artist_id = a.id
                    WHERE ul.user_id = ?
                    ORDER BY ul.created_at DESC
                ");
                $stmt->execute([$effectiveUserId]);
                $favorites = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $favorites]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $songId = (int) ($data['song_id'] ?? 0);
        $userId = (int) ($sessionUser['id'] ?? 0);

        if ($songId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'song_id is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT id FROM user_likes WHERE user_id = ? AND song_id = ?");
            $stmt->execute([$userId, $songId]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Song already in favorites']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO user_likes (user_id, song_id) VALUES (?, ?)");
            $stmt->execute([$userId, $songId]);
            syncSongLikes($pdo, $songId);

            echo json_encode(['success' => true, 'message' => 'Song added to favorites']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $songId = (int) ($data['song_id'] ?? ($_GET['song_id'] ?? 0));
        $userId = (int) ($sessionUser['id'] ?? 0);

        if ($songId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'song_id is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM user_likes WHERE user_id = ? AND song_id = ?");
            $stmt->execute([$userId, $songId]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Favorite not found']);
            } else {
                syncSongLikes($pdo, $songId);
                echo json_encode(['success' => true, 'message' => 'Song removed from favorites']);
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
