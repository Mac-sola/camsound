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

function getNotificationById(PDO $pdo, int $notificationId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE id = ? LIMIT 1");
    $stmt->execute([$notificationId]);
    $notification = $stmt->fetch();
    return $notification ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        requireAuthenticatedUser($sessionUser);

        try {
            $requestedUserId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
            $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
            $effectiveUserId = (int) ($sessionUser['id'] ?? 0);

            if ($requestedUserId > 0 && !isAdmin($sessionUser) && $requestedUserId !== $effectiveUserId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            if (isAdmin($sessionUser) && $requestedUserId > 0) {
                $effectiveUserId = $requestedUserId;
            }

            if ($unreadOnly) {
                $stmt = $pdo->prepare("
                    SELECT * FROM notifications
                    WHERE user_id = ? AND is_read = 0
                    ORDER BY created_at DESC
                ");
                $stmt->execute([$effectiveUserId]);
            } else {
                $stmt = $pdo->prepare("
                    SELECT * FROM notifications
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT 100
                ");
                $stmt->execute([$effectiveUserId]);
            }

            $notifications = $stmt->fetchAll();

            $stmt = $pdo->prepare("SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0");
            $stmt->execute([$effectiveUserId]);
            $unread = $stmt->fetch();

            echo json_encode([
                'success' => true,
                'data' => $notifications,
                'unread_count' => (int) $unread['unread_count']
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $message = trim((string) ($data['message'] ?? ''));
        $type = trim((string) ($data['type'] ?? 'system'));
        $targetId = isset($data['target_id']) ? (int) $data['target_id'] : null;
        $targetUserId = isset($data['user_id']) ? (int) $data['user_id'] : (int) ($sessionUser['id'] ?? 0);

        if ($message === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'message is required']);
            exit;
        }

        if (!isAdmin($sessionUser)) {
            $targetUserId = (int) ($sessionUser['id'] ?? 0);
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, target_id, is_read) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$targetUserId, $message, $type, $targetId, 0]);
            $notificationId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Notification created successfully',
                'data' => ['id' => (int) $notificationId]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'PUT':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $notificationId = (int) ($data['id'] ?? 0);
        $action = $data['action'] ?? null;

        try {
            if ($action === 'mark_all_read') {
                $requestedUserId = isset($data['user_id']) ? (int) $data['user_id'] : (int) ($sessionUser['id'] ?? 0);
                if (!isAdmin($sessionUser) && $requestedUserId !== (int) ($sessionUser['id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    break;
                }

                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
                $stmt->execute([$requestedUserId]);
                echo json_encode(['success' => true, 'message' => 'All notifications marked as read']);
                break;
            }

            if ($notificationId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Notification ID is required']);
                break;
            }

            $notification = getNotificationById($pdo, $notificationId);
            if (!$notification) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Notification not found']);
                break;
            }

            $ownsNotification = (int) $notification['user_id'] === (int) ($sessionUser['id'] ?? 0);
            if (!isAdmin($sessionUser) && !$ownsNotification) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            if ($action === 'mark_read') {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
                $stmt->execute([$notificationId]);
                echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
                break;
            }

            $updates = [];
            $params = [];

            if (isset($data['message']) && isAdmin($sessionUser)) {
                $updates[] = "message = ?";
                $params[] = trim((string) $data['message']);
            }
            if (isset($data['is_read'])) {
                $updates[] = "is_read = ?";
                $params[] = $data['is_read'] ? 1 : 0;
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
                break;
            }

            $params[] = $notificationId;
            $stmt = $pdo->prepare("UPDATE notifications SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            echo json_encode(['success' => true, 'message' => 'Notification updated successfully']);
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
