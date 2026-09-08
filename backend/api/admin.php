<?php
header('Content-Type: application/json');
require_once '../cors.php';

require_once '../db.php';
require_once '../security.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit(0);
}

secure_session_start();

// Basic authentication check
function checkAdminAccess()
{
    if (!isset($_SESSION['user']) || !$_SESSION['user']['isLoggedIn']) {
        return false;
    }

    // Check if user is an admin
    return isset($_SESSION['user']['type']) && $_SESSION['user']['type'] === 'admin';
}

if (!checkAdminAccess()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
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

function tableExists(PDO $pdo, string $tableName): bool
{
    try {
        $stmt = $pdo->prepare('SHOW TABLES LIKE ?');
        $stmt->execute([$tableName]);
        return (bool) $stmt->fetchColumn();
    } catch (PDOException $e) {
        return false;
    }
}

switch ($method) {
    case 'GET':
        // GET requests are read-only; no CSRF required
        handleGetRequests($action);
        break;
    case 'POST':
        require_csrf_token();
        handlePostRequests($action);
        break;
    case 'PUT':
        require_csrf_token();
        handlePutRequests($action);
        break;
    case 'DELETE':
        require_csrf_token();
        handleDeleteRequests($action);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function handleGetRequests($action)
{
    global $pdo;

    try {
        switch ($action) {
            case 'users':
                $type = $_GET['type'] ?? '';
                $status = $_GET['status'] ?? '';
                $sql = "SELECT id, name, email, phone, type, status, joined, avatar FROM users WHERE 1=1";
                $params = [];

                if ($type) {
                    $sql .= " AND type = ?";
                    $params[] = $type;
                }
                if ($status) {
                    $sql .= " AND status = ?";
                    $params[] = $status;
                }

                $sql .= " ORDER BY id DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $users = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $users]);
                break;

            case 'artists':
                $verification = $_GET['verification'] ?? '';
                $sql = "SELECT a.*, u.name as user_name, u.email FROM artists a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1";
                $params = [];

                if ($verification) {
                    $sql .= " AND a.verification = ?";
                    $params[] = $verification;
                }

                $sql .= " ORDER BY a.id DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $artists = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $artists]);
                break;

            case 'songs':
                $status = $_GET['status'] ?? '';
                $sql = "SELECT s.*, a.name as artist_name FROM songs s JOIN artists a ON s.artist_id = a.id WHERE 1=1";
                $params = [];

                if ($status) {
                    $sql .= " AND s.status = ?";
                    $params[] = $status;
                }

                $sql .= " ORDER BY s.id DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $songs = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $songs]);
                break;

            case 'reports':
                $status = $_GET['status'] ?? '';
                $sql = "SELECT r.*, ru.name as reporter_name, rd.name as reported_name, s.title as song_title
                        FROM reports r
                        LEFT JOIN users ru ON r.reporter_id = ru.id
                        LEFT JOIN users rd ON r.reported_user_id = rd.id
                        LEFT JOIN songs s ON r.reported_song_id = s.id
                        WHERE 1=1";
                $params = [];

                if ($status) {
                    $sql .= " AND r.status = ?";
                    $params[] = $status;
                }

                $sql .= " ORDER BY r.created_at DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $reports = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $reports]);
                break;

            case 'activity_logs':
                $user_id = $_GET['user_id'] ?? '';
                $sql = "SELECT al.*, u.name FROM activity_logs al JOIN users u ON al.user_id = u.id WHERE 1=1";
                $params = [];

                if ($user_id) {
                    $sql .= " AND al.user_id = ?";
                    $params[] = $user_id;
                }

                $sql .= " ORDER BY al.created_at DESC LIMIT 100";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $logs = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $logs]);
                break;

            case 'revenue':
                $period = $_GET['period'] ?? 'month'; // month, quarter, year

                $dateCondition = "";
                switch ($period) {
                    case 'month':
                        $dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
                        break;
                    case 'quarter':
                        $dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)";
                        break;
                    case 'year':
                        $dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
                        break;
                }

                // Subscription revenue
                $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'completed' $dateCondition");
                $stmt->execute();
                $subscriptionRevenue = $stmt->fetch()['total'] ?? 0;

                // Ad revenue
                $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM ad_revenue WHERE status IN ('active','completed')" . str_replace('AND created_at', 'AND start_date', $dateCondition));
                $stmt->execute();
                $adRevenue = $stmt->fetch()['total'] ?? 0;

                // Royalties paid
                $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM royalties WHERE status = 'paid' " . str_replace('AND created_at', 'AND paid_at', $dateCondition));
                $stmt->execute();
                $royaltiesPaid = $stmt->fetch()['total'] ?? 0;

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'subscription_revenue' => floatval($subscriptionRevenue),
                        'ad_revenue' => floatval($adRevenue),
                        'royalties_paid' => floatval($royaltiesPaid),
                        'total_revenue' => floatval($subscriptionRevenue) + floatval($adRevenue),
                        'period' => $period
                    ]
                ]);
                break;

            case 'analytics':
                $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
                $totalUsers = $stmt->fetch()['total_users'];

                $stmt = $pdo->query("SELECT COUNT(*) as total_artists FROM artists WHERE verification = 'approved'");
                $totalArtists = $stmt->fetch()['total_artists'];

                $stmt = $pdo->query("SELECT COUNT(*) as total_songs FROM songs WHERE status = 'active'");
                $totalSongs = $stmt->fetch()['total_songs'];

                $stmt = $pdo->query("SELECT SUM(plays) as total_plays FROM songs");
                $totalPlays = $stmt->fetch()['total_plays'];

                $stmt = $pdo->query("SELECT COUNT(*) as active_subscriptions FROM subscriptions WHERE status = 'active'");
                $activeSubscriptions = $stmt->fetch()['active_subscriptions'];

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'total_users' => intval($totalUsers),
                        'total_artists' => intval($totalArtists),
                        'total_songs' => intval($totalSongs),
                        'total_plays' => intval($totalPlays),
                        'active_subscriptions' => intval($activeSubscriptions)
                    ]
                ]);
                break;

            case 'settings':
                $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
                $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
                echo json_encode(['success' => true, 'data' => $settings]);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handlePostRequests($action)
{
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        switch ($action) {
            case 'approve_artist':
                $sql = "UPDATE artists SET verification = 'approved', status = 'verified' WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$data['artist_id']]);
                echo json_encode(['success' => true, 'message' => 'Artist approved successfully']);
                break;

            case 'reject_artist':
                $sql = "UPDATE artists SET verification = 'rejected', status = 'pending' WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$data['artist_id']]);
                echo json_encode(['success' => true, 'message' => 'Artist rejected']);
                break;

            case 'approve_song':
                $sql = "UPDATE songs SET status = 'active' WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$data['song_id']]);
                echo json_encode(['success' => true, 'message' => 'Song approved successfully']);
                break;

            case 'block_song':
                $sql = "UPDATE songs SET status = 'blocked' WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$data['song_id']]);
                echo json_encode(['success' => true, 'message' => 'Song blocked']);
                break;

            case 'reject_song':
                $sql = "UPDATE songs SET status = 'blocked' WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$data['song_id']]);
                echo json_encode(['success' => true, 'message' => 'Song rejected']);
                break;

            case 'reset_demo':
                if (tableExists($pdo, 'listening_history')) {
                    $pdo->exec('DELETE FROM listening_history');
                }
                if (tableExists($pdo, 'activity_logs')) {
                    $pdo->exec('DELETE FROM activity_logs');
                }
                $pdo->exec('UPDATE songs SET plays = 0, likes = 0, downloads = 0');
                echo json_encode(['success' => true, 'message' => 'Demo state reset successfully']);
                break;

            case 'feature_content':
                // FIX: use actual session admin ID instead of hardcoded 1
                $actingAdminId = (int) ($_SESSION['user']['id'] ?? 0);
                $sql = "INSERT INTO featured_content (content_type, content_id, position, section, start_date, end_date, created_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $data['content_type'],
                    $data['content_id'],
                    $data['position'] ?? 1,
                    $data['section'] ?? 'homepage',
                    $data['start_date'],
                    $data['end_date'],
                    $actingAdminId
                ]);
                echo json_encode(['success' => true, 'message' => 'Content featured successfully']);
                break;

            case 'resolve_report':
                // FIX: use actual session admin ID instead of hardcoded 1
                $actingAdminId = (int) ($_SESSION['user']['id'] ?? 0);
                if ($actingAdminId <= 0) {
                    echo json_encode(['success' => false, 'message' => 'Cannot identify admin session']);
                    break;
                }
                $sql = "UPDATE reports SET status = 'resolved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$actingAdminId, $data['report_id']]);
                echo json_encode(['success' => true, 'message' => 'Report resolved']);
                break;

            case 'assign_role':
                $targetUserId = (int) ($data['user_id'] ?? 0);
                $newRole = (string) ($data['role'] ?? '');
                $actorId = (int) ($_SESSION['user']['id'] ?? 0);

                if ($targetUserId <= 0 || !isAllowedRole($newRole)) {
                    echo json_encode(['success' => false, 'message' => 'Invalid role or user']);
                    break;
                }

                if ($actorId === $targetUserId) {
                    echo json_encode(['success' => false, 'message' => 'You cannot change your own role']);
                    break;
                }

                $targetUser = getUserById($pdo, $targetUserId);
                if (!$targetUser) {
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                    break;
                }

                if ($newRole === 'admin' && $targetUser['type'] !== 'admin') {
                    echo json_encode(['success' => false, 'message' => 'Admin promotion is restricted']);
                    break;
                }

                if ($targetUser['type'] === 'admin' && $newRole !== 'admin') {
                    if (countAdmins($pdo, false) <= 1) {
                        echo json_encode(['success' => false, 'message' => 'Cannot demote the last admin']);
                        break;
                    }
                }

                $sql = "UPDATE users SET type = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$newRole, $targetUserId]);
                echo json_encode(['success' => true, 'message' => 'Role assigned successfully']);
                break;

            case 'change_status':
                $targetUserId = (int) ($data['user_id'] ?? 0);
                $newStatus = (string) ($data['status'] ?? '');
                $actorId = (int) ($_SESSION['user']['id'] ?? 0);

                if ($targetUserId <= 0 || !isAllowedStatus($newStatus)) {
                    echo json_encode(['success' => false, 'message' => 'Invalid status or user']);
                    break;
                }

                if ($actorId === $targetUserId) {
                    echo json_encode(['success' => false, 'message' => 'You cannot change your own status']);
                    break;
                }

                $targetUser = getUserById($pdo, $targetUserId);
                if (!$targetUser) {
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                    break;
                }

                if ($targetUser['type'] === 'admin' && $newStatus !== 'active') {
                    if (countAdmins($pdo, true) <= 1) {
                        echo json_encode(['success' => false, 'message' => 'Cannot block the last active admin']);
                        break;
                    }
                }

                $sql = "UPDATE users SET status = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$newStatus, $targetUserId]);
                echo json_encode(['success' => true, 'message' => 'User status updated']);
                break;

            case 'reset_password':
                $targetUserId = (int) ($data['user_id'] ?? 0);
                $newPassword = (string) ($data['password'] ?? '');
                $actorId = (int) ($_SESSION['user']['id'] ?? 0);

                if ($targetUserId <= 0) {
                    echo json_encode(['success' => false, 'message' => 'Invalid user']);
                    break;
                }

                if ($actorId === $targetUserId) {
                    echo json_encode(['success' => false, 'message' => 'Use profile settings to change your own password']);
                    break;
                }

                if (strlen($newPassword) < 8 || !preg_match('/[A-Z]/', $newPassword) || !preg_match('/[a-z]/', $newPassword) || !preg_match('/\d/', $newPassword)) {
                    echo json_encode(['success' => false, 'message' => 'Password must be 8+ chars with upper, lower, and number']);
                    break;
                }

                $targetUser = getUserById($pdo, $targetUserId);
                if (!$targetUser) {
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                    break;
                }

                if ($targetUser['type'] === 'admin') {
                    echo json_encode(['success' => false, 'message' => 'Admin password reset is restricted']);
                    break;
                }

                $sql = "UPDATE users SET password = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $stmt->execute([$hashedPassword, $targetUserId]);
                echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
                break;

            case 'settings':
                $pdo->beginTransaction();
                try {
                    foreach ($data as $key => $value) {
                        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
                        $stmt->execute([$key, $value, $value]);
                    }
                    $pdo->commit();
                    echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Error saving settings: ' . $e->getMessage()]);
                }
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handlePutRequests($action)
{
    // FIX: Previously this blindly forwarded all PUT requests to handlePostRequests().
    // Now PUT only handles settings updates; all state-changing actions require POST.
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        switch ($action) {
            case 'settings':
                if (!is_array($data)) {
                    echo json_encode(['success' => false, 'message' => 'Invalid settings payload']);
                    break;
                }
                $pdo->beginTransaction();
                try {
                    foreach ($data as $key => $value) {
                        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
                        $stmt->execute([$key, $value, $value]);
                    }
                    $pdo->commit();
                    echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Error saving settings: ' . $e->getMessage()]);
                }
                break;

            default:
                // All other mutations (approve, block, assign_role, etc.) must use POST
                echo json_encode(['success' => false, 'message' => 'Use POST for action: ' . htmlspecialchars($action)]);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handleDeleteRequests($action)
{
    global $pdo;

    try {
        switch ($action) {
            case 'user':
                $id = (int) ($_GET['id'] ?? 0);
                $actorId = (int) ($_SESSION['user']['id'] ?? 0);

                if ($id <= 0) {
                    echo json_encode(['success' => false, 'message' => 'Invalid user id']);
                    break;
                }

                if ($actorId === $id) {
                    echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
                    break;
                }

                $targetUser = getUserById($pdo, $id);
                if (!$targetUser) {
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                    break;
                }

                if ($targetUser['type'] === 'admin' && countAdmins($pdo, false) <= 1) {
                    echo json_encode(['success' => false, 'message' => 'Cannot delete the last admin']);
                    break;
                }

                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
                break;

            case 'featured_content':
                $id = (int) ($_GET['id'] ?? 0);
                if ($id <= 0) {
                    echo json_encode(['success' => false, 'message' => 'Invalid featured content id']);
                    break;
                }
                $stmt = $pdo->prepare("DELETE FROM featured_content WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'message' => 'Featured content removed']);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
