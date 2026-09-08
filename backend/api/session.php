<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../security.php';

secure_session_start();

function destroy_session(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool) ($params['secure'] ?? false),
            (bool) ($params['httponly'] ?? true)
        );
    }

    session_destroy();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'DELETE') {
    require_csrf_token();
    destroy_session();
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    exit;
}

if (!isset($_SESSION['user']) || empty($_SESSION['user']['isLoggedIn'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in',
        'csrf_token' => $_SESSION['csrf_token'] ?? null
    ]);
    exit;
}

$sessionUser = $_SESSION['user'];
$userId = $_SESSION['user_id'] ?? ($sessionUser['id'] ?? null);

if ($userId) {
    try {
        require_once '../db.php';

        $stmt = $pdo->prepare("SELECT id, name, email, phone, type, status, joined, avatar FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([(int) $userId]);
        $dbUser = $stmt->fetch();

        if (!$dbUser) {
            destroy_session();
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Session expired'
            ]);
            exit;
        }

        if (($dbUser['status'] ?? '') !== 'active') {
            destroy_session();
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Account is not active'
            ]);
            exit;
        }

        $_SESSION['user'] = array_merge($sessionUser, [
            'id' => (int) $dbUser['id'],
            'name' => $dbUser['name'],
            'email' => $dbUser['email'],
            'phone' => $dbUser['phone'],
            'type' => $dbUser['type'],
            'status' => $dbUser['status'],
            'joined' => $dbUser['joined'],
            'avatar' => $dbUser['avatar'],
            'isLoggedIn' => true
        ]);
        $_SESSION['user_id'] = (int) $dbUser['id'];
        $sessionUser = $_SESSION['user'];
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Session refresh failed'
        ]);
        exit;
    }
}

echo json_encode([
    'success' => true,
    'csrf_token' => $_SESSION['csrf_token'] ?? null,
    'data' => [
        'user' => $sessionUser
    ]
]);
?>
