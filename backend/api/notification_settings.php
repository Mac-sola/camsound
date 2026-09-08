<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../db.php';
require_once '../security.php';
secure_session_start();

function ensure_notification_settings_table(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_notification_settings (
            user_id INT NOT NULL PRIMARY KEY,
            notif_new_followers TINYINT(1) NOT NULL DEFAULT 1,
            notif_comments TINYINT(1) NOT NULL DEFAULT 1,
            notif_stream_milestones TINYINT(1) NOT NULL DEFAULT 1,
            notif_revenue_updates TINYINT(1) NOT NULL DEFAULT 1,
            notif_marketing TINYINT(1) NOT NULL DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT user_notification_settings_user_fk
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
}

$userId = $_SESSION['user']['id'] ?? null;
if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    ensure_notification_settings_table($pdo);
} catch (PDOException $e) {
    error_log('Notification settings table check failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT notif_new_followers, notif_comments, notif_stream_milestones, notif_revenue_updates, notif_marketing FROM user_notification_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('Notification settings GET failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
        exit;
    }
    if (!$row) {
        // Defaults if not set
        $row = [
            'notif_new_followers' => 1,
            'notif_comments' => 1,
            'notif_stream_milestones' => 1,
            'notif_revenue_updates' => 1,
            'notif_marketing' => 1
        ];
    }
    echo json_encode(['success' => true, 'data' => $row]);
    exit;
}

if ($method === 'POST') {
    require_csrf_token();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        exit;
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO user_notification_settings (user_id, notif_new_followers, notif_comments, notif_stream_milestones, notif_revenue_updates, notif_marketing) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE notif_new_followers=VALUES(notif_new_followers), notif_comments=VALUES(notif_comments), notif_stream_milestones=VALUES(notif_stream_milestones), notif_revenue_updates=VALUES(notif_revenue_updates), notif_marketing=VALUES(notif_marketing)');
        $stmt->execute([
            $userId,
            !empty($input['notif_new_followers']) ? 1 : 0,
            !empty($input['notif_comments']) ? 1 : 0,
            !empty($input['notif_stream_milestones']) ? 1 : 0,
            !empty($input['notif_revenue_updates']) ? 1 : 0,
            !empty($input['notif_marketing']) ? 1 : 0
        ]);
    } catch (PDOException $e) {
        error_log('Notification settings POST failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
        exit;
    }
    echo json_encode(['success' => true, 'message' => 'Notification settings saved']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
