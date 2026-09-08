<?php
/**
 * cors.php — Centralized CORS helper for all API endpoints.
 *
 * This file MUST be included at the very top of every API script,
 * before any other output. Call cors_headers() to emit the headers.
 *
 * Allowed origins: same host the app is served from (supports HTTP & HTTPS,
 * and localhost variants for local development).
 */

function cors_headers(): void {
    // Determine the requesting origin
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Build the list of allowed origins dynamically:
    //  • Same host the server is running on (handles prod domain automatically)
    //  • Explicit localhost variants for XAMPP dev
    $serverHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $allowed = [
        'http://'  . $serverHost,
        'https://' . $serverHost,
        'http://localhost',
        'https://localhost',
        'http://127.0.0.1',
        'https://127.0.0.1',
    ];

    if ($origin && in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    } else {
        // Do NOT emit Access-Control-Allow-Origin at all for unlisted origins:
        // browsers will block the request, which is the desired behaviour.
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    // Preflight — respond immediately
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

cors_headers();
