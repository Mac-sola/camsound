<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../security.php';
secure_session_start();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['POST', 'DELETE'], true)) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}
require_csrf_token();

// Unset all session variables
$_SESSION = array();

// Destroy the session cookie if it exists
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 42000, '/');
}

// Destroy the session
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
