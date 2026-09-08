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

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

if (!$sessionUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

switch ($method) {
    case 'GET':
        try {
            // Only artists can fetch their withdrawals, or admin
            $userId = (int) $sessionUser['id'];
            
            // First find the artist_id for this user
            $stmt = $pdo->prepare("SELECT id FROM artists WHERE user_id = ? LIMIT 1");
            $stmt->execute([$userId]);
            $artist = $stmt->fetch();
            
            if (!$artist && $sessionUser['type'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'User is not an artist']);
                break;
            }

            if ($sessionUser['type'] === 'admin') {
                $stmt = $pdo->query("SELECT w.*, a.name as artist_name FROM withdrawals w JOIN artists a ON w.artist_id = a.id ORDER BY w.id DESC");
                $withdrawals = $stmt->fetchAll();
            } else {
                $artistId = (int) $artist['id'];
                $stmt = $pdo->prepare("SELECT * FROM withdrawals WHERE artist_id = ? ORDER BY id DESC");
                $stmt->execute([$artistId]);
                $withdrawals = $stmt->fetchAll();
            }

            echo json_encode(['success' => true, 'data' => $withdrawals]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        try {
            $amount = isset($data['amount']) ? (float) $data['amount'] : 0;
            $phoneNumber = trim((string) ($data['phone_number'] ?? ''));
            $userId = (int) $sessionUser['id'];

            if ($amount < 5000) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Minimum withdrawal is 5000']);
                break;
            }
            if (empty($phoneNumber)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Phone number is required']);
                break;
            }

            $stmt = $pdo->prepare("SELECT id FROM artists WHERE user_id = ? LIMIT 1");
            $stmt->execute([$userId]);
            $artist = $stmt->fetch();
            
            if (!$artist) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'User is not an artist']);
                break;
            }

            $artistId = (int) $artist['id'];

            // In a real scenario, this would contact MTN API and be marked 'pending'
            $stmt = $pdo->prepare(
                "INSERT INTO withdrawals (artist_id, amount, momo_number, status, transaction_id, processed_at)
                 VALUES (?, ?, ?, 'completed', ?, NOW())"
            );
            $txId = 'TXN-' . strtoupper(uniqid());
            $stmt->execute([$artistId, $amount, $phoneNumber, $txId]);

            echo json_encode(['success' => true, 'message' => 'Withdrawal processed', 'transaction_id' => $txId]);
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
