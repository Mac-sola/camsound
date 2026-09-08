<?php
ob_start();
require_once '../cors.php';
require_once '../security.php';
secure_session_start();

function sendResponse($success, $message, $data = null, $httpCode = 200) {
    if (ob_get_length()) ob_clean();
    http_response_code($httpCode);
    $payload = [
        'success' => $success,
        'message' => $message,
        'data' => $data
    ];
    if (!empty($_SESSION['csrf_token'])) {
        $payload['csrf_token'] = $_SESSION['csrf_token'];
    }
    echo json_encode($payload);
    ob_end_flush();
    exit;
}

try {
    require_once '../db.php';
} catch (Exception $e) {
    sendResponse(false, 'Database configuration error', ['error' => $e->getMessage()], 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendResponse(false, 'Invalid JSON input received', null, 400);
}

if (empty($data['email']) || empty($data['password'])) {
    sendResponse(false, 'Email and password are required', null, 400);
}

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX login_attempt_lookup (email, ip_address, attempted_at)
    )");

    $email = strtolower(trim((string) $data['email']));
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $pruneStmt = $pdo->prepare("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
    $pruneStmt->execute();

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM login_attempts WHERE email = ? AND ip_address = ? AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
    $countStmt->execute([$email, $ipAddress]);
    if ((int) $countStmt->fetchColumn() >= 5) {
        sendResponse(false, 'Too many login attempts. Please wait 15 minutes and try again.', null, 429);
    }

    $stmt = $pdo->prepare("SELECT id, name, email, phone, password, type, status, joined, avatar FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($data['password'], $user['password'])) {
        $failStmt = $pdo->prepare("INSERT INTO login_attempts (email, ip_address) VALUES (?, ?)");
        $failStmt->execute([$email, $ipAddress]);
        sendResponse(false, 'Invalid email or password', null, 401);
    }

    if ($user['status'] !== 'active') {
        sendResponse(false, 'Account is not active', null, 403);
    }

    // Regenerate session ID to prevent session fixation attacks
    session_regenerate_id(true);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    // Store user data in session
    $_SESSION['user'] = [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'type' => $user['type'],
        'isLoggedIn' => true
    ];
    // For compatibility with me.php
    $_SESSION['user_id'] = $user['id'];

    $clearStmt = $pdo->prepare("DELETE FROM login_attempts WHERE email = ? AND ip_address = ?");
    $clearStmt->execute([$email, $ipAddress]);

    unset($user['password']);

    sendResponse(true, 'Login successful', [
        'user' => $user
    ]);

} catch (PDOException $e) {
    sendResponse(false, 'Database error occurred', null, 500);
}
