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

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        requireAuthenticatedUser($sessionUser);

        try {
            $requestedUserId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;
            $effectiveUserId = (int) ($sessionUser['id'] ?? 0);

            if ($requestedUserId > 0 && !isAdmin($sessionUser) && $requestedUserId !== $effectiveUserId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            if (isAdmin($sessionUser) && $requestedUserId > 0) {
                $effectiveUserId = $requestedUserId;
            }

            $limit = max(1, min($limit, 200));

            $stmt = $pdo->prepare("
                SELECT lh.*, s.title, s.genre, s.duration, s.plays, s.likes,
                       a.name AS artist_name, a.id AS artist_id
                FROM listening_history lh
                JOIN songs s ON lh.song_id = s.id
                LEFT JOIN artists a ON s.artist_id = a.id
                WHERE lh.user_id = ?
                ORDER BY lh.played_at DESC
                LIMIT ?
            ");
            $stmt->bindValue(1, $effectiveUserId, PDO::PARAM_INT);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->execute();
            $history = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $history]);
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
            $stmt = $pdo->prepare("INSERT INTO listening_history (user_id, song_id) VALUES (?, ?)");
            $stmt->execute([$userId, $songId]);

            // NOTE: plays counter is managed exclusively by track.php (action=play).
            // Do NOT increment songs.plays here to avoid double-counting.

            echo json_encode(['success' => true, 'message' => 'Listening history updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $historyId = (int) ($data['history_id'] ?? ($_GET['history_id'] ?? 0));
        $userId = (int) ($sessionUser['id'] ?? 0);

        try {
            if ($historyId > 0) {
                $stmt = $pdo->prepare("DELETE FROM listening_history WHERE id = ? AND user_id = ?");
                $stmt->execute([$historyId, $userId]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM listening_history WHERE user_id = ?");
                $stmt->execute([$userId]);
            }

            echo json_encode(['success' => true, 'message' => 'Listening history cleared']);
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
