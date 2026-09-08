<?php
/**
 * Shared security helpers for API endpoints.
 */

function secure_session_start(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        session_start();
    }

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function current_session_user(): ?array
{
    $user = $_SESSION['user'] ?? null;
    if (!$user || empty($user['isLoggedIn'])) {
        return null;
    }

    return $user;
}

function session_user_is_admin(?array $user = null): bool
{
    $user = $user ?? current_session_user();
    return $user && ($user['type'] ?? '') === 'admin';
}

function require_session_user(): array
{
    $user = current_session_user();
    if ($user) {
        return $user;
    }

    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

function require_admin_user(): array
{
    $user = require_session_user();
    if (session_user_is_admin($user)) {
        return $user;
    }

    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

function require_csrf_token(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        return;
    }

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($token !== '' && hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        return;
    }

    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'CSRF validation failed']);
    exit;
}
?>
