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

function normalizeSubscriptionStatus(string $status): ?string
{
    $allowed = ['active', 'expired', 'cancelled'];
    return in_array($status, $allowed, true) ? $status : null;
}

function getSubscriptionById(PDO $pdo, int $subscriptionId): ?array
{
    $stmt = $pdo->prepare(
        "SELECT s.*, u.name AS user_name
         FROM subscriptions s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ?
         LIMIT 1"
    );
    $stmt->execute([$subscriptionId]);
    $subscription = $stmt->fetch();

    return $subscription ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        try {
            $subscriptionId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;

            if ($subscriptionId > 0) {
                requireAuthenticatedUser($sessionUser);

                $subscription = getSubscriptionById($pdo, $subscriptionId);
                if (!$subscription) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Subscription not found']);
                    break;
                }

                $ownsSubscription = (int) $subscription['user_id'] === (int) ($sessionUser['id'] ?? 0);
                if (!isAdmin($sessionUser) && !$ownsSubscription) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    break;
                }

                echo json_encode(['success' => true, 'data' => $subscription]);
                break;
            }

            if ($userId > 0) {
                requireAuthenticatedUser($sessionUser);

                if (!isAdmin($sessionUser) && (int) ($sessionUser['id'] ?? 0) !== $userId) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    break;
                }

                $stmt = $pdo->prepare(
                    "SELECT s.*, u.name AS user_name
                     FROM subscriptions s
                     LEFT JOIN users u ON s.user_id = u.id
                     WHERE s.user_id = ?
                     ORDER BY s.id DESC"
                );
                $stmt->execute([$userId]);
                $subscriptions = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $subscriptions]);
                break;
            }

            if (!isAdmin($sessionUser)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            $stmt = $pdo->query(
                "SELECT s.*, u.name AS user_name
                 FROM subscriptions s
                 LEFT JOIN users u ON s.user_id = u.id
                 ORDER BY s.id DESC"
            );
            $subscriptions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $subscriptions]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        try {
            $userId = (int) ($data['user_id'] ?? 0);
            $planName = trim((string) ($data['plan_name'] ?? ''));
            $amount = isset($data['amount']) ? (float) $data['amount'] : null;
            $startDate = $data['start_date'] ?? null;
            $endDate = $data['end_date'] ?? null;
            $status = normalizeSubscriptionStatus((string) ($data['status'] ?? 'active'));
            $isAdminUser = isAdmin($sessionUser);

            if (!$isAdminUser) {
                if ($userId !== (int) ($sessionUser['id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'You can only create subscriptions for your own account']);
                    break;
                }
                $status = 'active';
            }

            if ($userId <= 0 || $planName === '' || $amount === null || !$startDate || !$endDate || $status === null) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid subscription payload']);
                break;
            }

            $stmt = $pdo->prepare(
                "INSERT INTO subscriptions (user_id, plan_name, amount, status, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([$userId, $planName, $amount, $status, $startDate, $endDate]);
            echo json_encode(['success' => true, 'message' => 'Subscription created successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'PUT':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        if (!isAdmin($sessionUser)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        try {
            $subscriptionId = (int) ($data['id'] ?? 0);
            $userId = (int) ($data['user_id'] ?? 0);
            $planName = trim((string) ($data['plan_name'] ?? ''));
            $amount = isset($data['amount']) ? (float) $data['amount'] : null;
            $startDate = $data['start_date'] ?? null;
            $endDate = $data['end_date'] ?? null;
            $status = normalizeSubscriptionStatus((string) ($data['status'] ?? ''));

            if ($subscriptionId <= 0 || $userId <= 0 || $planName === '' || $amount === null || !$startDate || !$endDate || $status === null) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid subscription payload']);
                break;
            }

            if (!getSubscriptionById($pdo, $subscriptionId)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Subscription not found']);
                break;
            }

            $stmt = $pdo->prepare(
                "UPDATE subscriptions
                 SET user_id = ?, plan_name = ?, amount = ?, status = ?, start_date = ?, end_date = ?
                 WHERE id = ?"
            );
            $stmt->execute([$userId, $planName, $amount, $status, $startDate, $endDate, $subscriptionId]);
            echo json_encode(['success' => true, 'message' => 'Subscription updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        if (!isAdmin($sessionUser)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            break;
        }

        $subscriptionId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($subscriptionId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing id']);
            break;
        }

        try {
            if (!getSubscriptionById($pdo, $subscriptionId)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Subscription not found']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM subscriptions WHERE id = ?");
            $stmt->execute([$subscriptionId]);
            echo json_encode(['success' => true, 'message' => 'Subscription deleted successfully']);
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
