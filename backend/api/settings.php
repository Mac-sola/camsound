<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../db.php';
require_once '../security.php';
secure_session_start();

$method = $_SERVER['REQUEST_METHOD'];

// Handle GET - Retrieve all settings (Publicly accessible for platform name)
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Ensure default if empty
        if (!isset($settings['platform_name'])) {
            $settings['platform_name'] = 'AfroRythm';
        }

        echo json_encode([
            'success' => true,
            'data' => $settings
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// Handle POST - Update settings (Admin only)
if ($method === 'POST') {
    require_csrf_token();
    // Check if user is admin
    if (!isset($_SESSION['user']) || $_SESSION['user']['type'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin access required.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (:key, :value) 
                                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

        foreach ($input as $key => $value) {
            // Mapping for backward compatibility if needed
            $dbKey = $key;
            if ($key === 'site_name')
                $dbKey = 'platform_name';
            if ($key === 'site_description')
                $dbKey = 'platform_description';

            $stmt->execute(['key' => $dbKey, 'value' => $value]);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Settings updated successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update settings: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
