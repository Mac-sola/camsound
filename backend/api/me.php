<?php
header('Content-Type: application/json');
require_once '../cors.php';

if (session_status() === PHP_SESSION_NONE) session_start();

require_once '../db.php';


$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, type, status, joined, avatar FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([(int)$userId]);
    $user = $stmt->fetch();
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    echo json_encode(['success' => true, 'data' => ['user' => $user]]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

?>
