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

function getExistingSong(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM songs WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $song = $stmt->fetch();
    return $song ?: null;
}

function getArtistIdForUser(PDO $pdo, int $userId): ?int
{
    $stmt = $pdo->prepare("SELECT id FROM artists WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $artistId = $stmt->fetchColumn();
    return $artistId === false ? null : (int) $artistId;
}

function normalizeSongStatus(string $status): ?string
{
    $allowed = ['active', 'pending', 'blocked'];
    return in_array($status, $allowed, true) ? $status : null;
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        try {
            $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            if ($id > 0) {
                $stmt = $pdo->prepare("SELECT s.*, a.name as artist_name, a.instagram_url, a.twitter_url, a.facebook_url, a.youtube_url FROM songs s LEFT JOIN artists a ON s.artist_id = a.id WHERE s.id = ?");
                $stmt->execute([$id]);
                $song = $stmt->fetch();
                if ($song) {
                    echo json_encode(['success' => true, 'data' => $song]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Song not found']);
                }
            } else {
                if (isAdmin($sessionUser)) {
                    $stmt = $pdo->query("SELECT s.*, a.name as artist_name, a.instagram_url, a.twitter_url, a.facebook_url, a.youtube_url FROM songs s LEFT JOIN artists a ON s.artist_id = a.id ORDER BY s.id DESC");
                } else {
                    $stmt = $pdo->query("SELECT s.*, a.name as artist_name, a.instagram_url, a.twitter_url, a.facebook_url, a.youtube_url FROM songs s LEFT JOIN artists a ON s.artist_id = a.id WHERE s.status = 'active' ORDER BY s.id DESC");
                }
                $songs = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $songs]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        if (($sessionUser['type'] ?? '') !== 'artist') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Only artist accounts can create songs']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        try {
            $artistId = getArtistIdForUser($pdo, (int) $sessionUser['id']);
            $title = trim((string) ($data['title'] ?? ''));
            $genre = trim((string) ($data['genre'] ?? ''));
            $duration = trim((string) ($data['duration'] ?? ''));
            $filePath = trim((string) ($data['file_path'] ?? ''));
            $coverArt = isset($data['cover_art']) ? trim((string) $data['cover_art']) : null;
            $status = normalizeSongStatus((string) ($data['status'] ?? 'active')) ?? 'active';

            if (!$artistId || $title === '' || $genre === '' || $duration === '' || $filePath === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid song payload']);
                break;
            }

            $stmt = $pdo->prepare(
                "INSERT INTO songs (title, artist_id, genre, duration, plays, likes, downloads, file_path, cover_art, status)
                 VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?)"
            );
            $stmt->execute([$title, $artistId, $genre, $duration, $filePath, $coverArt ?: null, $status]);
            echo json_encode(['success' => true, 'message' => 'Song created successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'PUT':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        try {
            $songId = (int) ($data['id'] ?? 0);
            if ($songId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Song ID is required']);
                break;
            }

            $existingSong = getExistingSong($pdo, $songId);
            if (!$existingSong) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Song not found']);
                break;
            }

            if (($sessionUser['type'] ?? '') !== 'artist') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Only the owning artist can update a song']);
                break;
            }

            $artistId = getArtistIdForUser($pdo, (int) $sessionUser['id']);
            if (!$artistId || (int) $existingSong['artist_id'] !== $artistId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You can only update your own songs']);
                break;
            }

            $title = trim((string) ($data['title'] ?? $existingSong['title']));
            $genre = trim((string) ($data['genre'] ?? $existingSong['genre']));
            $duration = trim((string) ($data['duration'] ?? $existingSong['duration']));

            if ($title === '' || $genre === '' || $duration === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Title, genre, and duration are required']);
                break;
            }

            $stmt = $pdo->prepare("UPDATE songs SET title = ?, genre = ?, duration = ? WHERE id = ?");
            $stmt->execute([$title, $genre, $duration, $songId]);
            echo json_encode(['success' => true, 'message' => 'Song updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $songId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($songId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Song ID is required']);
            break;
        }

        try {
            $existingSong = getExistingSong($pdo, $songId);
            if (!$existingSong) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Song not found']);
                break;
            }

            $isSongOwner = false;
            if (($sessionUser['type'] ?? '') === 'artist') {
                $artistId = getArtistIdForUser($pdo, (int) $sessionUser['id']);
                $isSongOwner = $artistId && (int) $existingSong['artist_id'] === $artistId;
            }

            if (!isAdmin($sessionUser) && !$isSongOwner) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM songs WHERE id = ?");
            $stmt->execute([$songId]);
            echo json_encode(['success' => true, 'message' => 'Song deleted successfully']);
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
