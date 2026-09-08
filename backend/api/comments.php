<?php
header('Content-Type: application/json');

// Session management
require_once '../security.php';
secure_session_start();

require_once '../db.php';
require_once '../cors.php';



$method = $_SERVER['REQUEST_METHOD'];
$userId = $_SESSION['user']['id'] ?? null;

switch ($method) {
    case 'GET':
        // GET /backend/api/comments.php?song_id=123
        try {
            $songId = $_GET['song_id'] ?? null;
            $type = $_GET['type'] ?? 'song';

            if ($type === 'recent') {
                // Fetch latest comments across the entire platform
                $stmt = $pdo->prepare("
                    SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.type as user_type, s.title as song_title 
                    FROM comments c 
                    JOIN users u ON c.user_id = u.id 
                    JOIN songs s ON c.song_id = s.id 
                    WHERE c.parent_id IS NULL 
                    ORDER BY c.created_at DESC 
                    LIMIT 15
                ");
                $stmt->execute();
                $comments = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $comments]);
                break;
            }

            if (!$songId && $type === 'song') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Song ID is required']);
                break;
            }

            // Fetch comments with user details - Sort pinned comments to the top
            $stmt = $pdo->prepare("
                SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.type as user_type 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.song_id = ? 
                ORDER BY c.created_at ASC
            ");
            $stmt->execute([$songId]);
            $comments = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $comments]);
        } catch (PDOException $e) {
            error_log('Comments GET failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        // POST /backend/api/comments.php
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $songId = $data['song_id'] ?? null;
        $content = $data['content'] ?? '';
        $parentId = $data['parent_id'] ?? null;

        if (!$songId || empty(trim($content))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Song ID and content are required']);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO comments (user_id, song_id, content, parent_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$userId, $songId, $content, $parentId]);
            
            $newId = $pdo->lastInsertId();
            
            // Get the newly created comment back with user info
            $stmt = $pdo->prepare("
                SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.type as user_type 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.id = ?
            ");
            $stmt->execute([$newId]);
            $newComment = $stmt->fetch();

            echo json_encode(['success' => true, 'data' => $newComment]);
        } catch (PDOException $e) {
            error_log('Comments POST failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'PUT':
        require_csrf_token();
        // Pin/Unpin comment: PUT /backend/api/comments.php
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $commentId = $data['id'] ?? null;
        $pin = $data['pin'] ?? null; // true to pin, false to unpin

        if (!$commentId || $pin === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Comment ID and pin status are required']);
            break;
        }

        try {
            // Security check: Only the ARTIST of the song can pin/unpin comments
            $stmt = $pdo->prepare("
                SELECT a.user_id as artist_user_id
                FROM comments c
                JOIN songs s ON c.song_id = s.id
                JOIN artists a ON s.artist_id = a.id
                WHERE c.id = ?
            ");
            $stmt->execute([$commentId]);
            $result = $stmt->fetch();

            if (!$result) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Comment or Song not found']);
                break;
            }

            if ($result['artist_user_id'] != $userId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Only the artist can pin/unpin comments']);
                break;
            }

            // Update is_pinned status
            $stmt = $pdo->prepare("UPDATE comments SET is_pinned = ? WHERE id = ?");
            $stmt->execute([$pin ? 1 : 0, $commentId]);

            echo json_encode(['success' => true, 'message' => $pin ? 'Comment pinned' : 'Comment unpinned']);
        } catch (PDOException $e) {
            error_log('Comments PUT failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        // DELETE /backend/api/comments.php?id=123
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            break;
        }

        $commentId = $_GET['id'] ?? null;
        if (!$commentId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Comment ID is required']);
            break;
        }

        try {
            // Check if user owns the comment OR is the artist of the song OR is admin
            $stmt = $pdo->prepare("
                SELECT c.user_id as author_id, a.user_id as artist_user_id
                FROM comments c
                JOIN songs s ON c.song_id = s.id
                JOIN artists a ON s.artist_id = a.id
                WHERE c.id = ?
            ");
            $stmt->execute([$commentId]);
            $comment = $stmt->fetch();

            if (!$comment) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Comment not found']);
                break;
            }

            $userType = $_SESSION['user']['type'] ?? '';
            $isAuthor = ($comment['author_id'] == $userId);
            $isArtist = ($comment['artist_user_id'] == $userId);
            $isAdmin = ($userType === 'admin');

            if (!$isAuthor && !$isArtist && !$isAdmin) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this comment']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
            $stmt->execute([$commentId]);

            echo json_encode(['success' => true, 'message' => 'Comment deleted successfully']);
        } catch (PDOException $e) {
            error_log('Comments DELETE failed: ' . $e->getMessage());
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
