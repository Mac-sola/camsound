<?php
header('Content-Type: application/json');

// Allow only same-origin requests that include credentials
$allowedOrigin = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';
require_once '../security.php';

if (session_status() === PHP_SESSION_NONE)
    session_start();
secure_session_start();

$method = $_SERVER['REQUEST_METHOD'];

// Helper: is the current session an authenticated admin?
function isAdmin(): bool
{
    return isset($_SESSION['user'])
        && !empty($_SESSION['user']['isLoggedIn'])
        && ($_SESSION['user']['type'] ?? '') === 'admin';
}

function getUserById(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT id, type, status FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function countAdmins(PDO $pdo, bool $activeOnly = false): int
{
    $sql = "SELECT COUNT(*) FROM users WHERE type = 'admin'";
    if ($activeOnly) {
        $sql .= " AND status = 'active'";
    }
    return (int) $pdo->query($sql)->fetchColumn();
}

function isAllowedRole(string $role): bool
{
    return in_array($role, ['fan', 'artist', 'admin'], true);
}

function isAllowedStatus(string $status): bool
{
    return in_array($status, ['active', 'pending', 'blocked'], true);
}

function createArtistProfile(PDO $pdo, int $userId, string $name): void
{
    $artistName = trim($name);
    if ($artistName === '') {
        $artistName = 'New Artist';
    }

    $stmt = $pdo->prepare(
        "INSERT INTO artists (
            user_id, name, genre, followers, songs_count, status, verification, bio, image
        ) VALUES (?, ?, 'Other', 0, 0, 'pending', 'pending', '', NULL)"
    );
    $stmt->execute([$userId, $artistName]);
}

switch ($method) {
    case 'GET':
        // User list is sensitive — admin only
        if (!isAdmin()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            break;
        }

        $id = $_GET['id'] ?? null;
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT id, name, email, phone, type, status, joined, avatar FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $user = $stmt->fetch();
                if ($user) {
                    echo json_encode(['success' => true, 'data' => $user]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                }
            } else {
                $stmt = $pdo->query("SELECT id, name, email, phone, type, status, joined, avatar FROM users ORDER BY id DESC");
                $users = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $users]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        // Basic validation
        if (!$data || empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['type'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            break;
        }
        $requestedType = (string) $data['type'];
        // Self-registration and admin-created accounts: fan/artist only.
        $allowedTypes = ['fan', 'artist'];
        if (!in_array($requestedType, $allowedTypes, true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden account type']);
            break;
        }

        $requestedStatus = (string) ($data['status'] ?? 'active');
        if (!isAllowedStatus($requestedStatus)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            break;
        }
        try {
            $pdo->beginTransaction();
            $sql = "INSERT INTO users (name, email, phone, password, type, status, joined, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            // Derive avatar initials from name
            $avatar = strtoupper(mb_substr($data['name'], 0, 2));
            $joined = date('Y-m-d');
            $status = $requestedStatus;
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? null,
                $hashedPassword,
                $requestedType,
                $status,
                $joined,
                $avatar
            ]);
            $newId = $pdo->lastInsertId();
            if ($requestedType === 'artist') {
                createArtistProfile($pdo, (int) $newId, (string) $data['name']);
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'User created successfully', 'data' => ['id' => (int) $newId]]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Email already registered']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Server error']);
            }
        }
        break;

    case 'PUT':
        require_csrf_token();
        // Only admins can update users via this endpoint
        if (!isAdmin()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            break;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $targetUserId = (int) ($data['id'] ?? 0);
            $actorId = (int) ($_SESSION['user']['id'] ?? 0);
            $newType = (string) ($data['type'] ?? '');
            $newStatus = (string) ($data['status'] ?? '');

            if ($targetUserId <= 0 || !isAllowedRole($newType) || !isAllowedStatus($newStatus)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid role, status, or user']);
                break;
            }

            if ($actorId === $targetUserId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You cannot edit your own role/status here']);
                break;
            }

            $targetUser = getUserById($pdo, $targetUserId);
            if (!$targetUser) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                break;
            }

            if ($newType === 'admin' && $targetUser['type'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Admin promotion is restricted']);
                break;
            }

            if ($targetUser['type'] === 'admin' && $newType !== 'admin' && countAdmins($pdo, false) <= 1) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Cannot demote the last admin']);
                break;
            }

            if ($targetUser['type'] === 'admin' && $newStatus !== 'active' && countAdmins($pdo, true) <= 1) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Cannot block the last active admin']);
                break;
            }

            $sql = "UPDATE users SET type=?, status=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$newType, $newStatus, $targetUserId]);
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        if (!isAdmin()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            break;
        }
        $id = (int) ($_GET['id'] ?? 0);
        $actorId = (int) ($_SESSION['user']['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing id']);
            break;
        }
        try {
            if ($actorId === $id) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
                break;
            }

            $targetUser = getUserById($pdo, $id);
            if (!$targetUser) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                break;
            }

            if ($targetUser['type'] === 'admin' && countAdmins($pdo, false) <= 1) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Cannot delete the last admin']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;
}
?>
