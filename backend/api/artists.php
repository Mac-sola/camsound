<?php
header('Content-Type: application/json');
require_once '../cors.php';

require_once '../db.php';
require_once '../security.php';

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

function getArtistById(PDO $pdo, int $artistId): ?array
{
    $stmt = $pdo->prepare(
        "SELECT a.*,
                u.name AS user_name,
                u.email AS user_email,
                COUNT(DISTINCT s.id) AS actual_songs_count,
                COALESCE(SUM(s.plays), 0) AS total_plays,
                COALESCE(SUM(s.likes), 0) AS total_likes,
                COALESCE(SUM(s.downloads), 0) AS total_downloads
         FROM artists a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN songs s ON a.id = s.artist_id
         WHERE a.id = ?
         GROUP BY a.id"
    );
    $stmt->execute([$artistId]);
    $artist = $stmt->fetch();

    return $artist ?: null;
}

function getArtistOwnerUserId(PDO $pdo, int $artistId): ?int
{
    $stmt = $pdo->prepare("SELECT user_id FROM artists WHERE id = ? LIMIT 1");
    $stmt->execute([$artistId]);
    $userId = $stmt->fetchColumn();

    return $userId === false ? null : (int) $userId;
}

function getUserById(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT id, type, status, name FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function userOwnsArtist(?array $user, int $artistUserId): bool
{
    return $user && (int) ($user['id'] ?? 0) === $artistUserId && ($user['type'] ?? '') === 'artist';
}

function filterArtistPayload(array $data, array $allowedKeys): array
{
    $filtered = [];
    foreach ($allowedKeys as $key) {
        if (array_key_exists($key, $data)) {
            $filtered[$key] = is_string($data[$key]) ? trim($data[$key]) : $data[$key];
        }
    }

    return $filtered;
}

function normalizeArtistStatus(string $status): ?string
{
    $allowed = ['verified', 'pending', 'rejected'];
    return in_array($status, $allowed, true) ? $status : null;
}

function normalizeVerificationStatus(string $status): ?string
{
    $allowed = ['approved', 'pending', 'rejected'];
    return in_array($status, $allowed, true) ? $status : null;
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        try {
            $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;

            if ($id > 0) {
                $artist = getArtistById($pdo, $id);
                if (!$artist) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Artist not found']);
                    break;
                }

                echo json_encode(['success' => true, 'data' => $artist]);
                break;
            }

            if ($userId > 0) {
                $stmt = $pdo->prepare(
                    "SELECT a.*,
                            u.name AS user_name,
                            u.email AS user_email,
                            COUNT(DISTINCT s.id) AS actual_songs_count,
                            COALESCE(SUM(s.plays), 0) AS total_plays,
                            COALESCE(SUM(s.likes), 0) AS total_likes,
                            COALESCE(SUM(s.downloads), 0) AS total_downloads
                     FROM artists a
                     LEFT JOIN users u ON a.user_id = u.id
                     LEFT JOIN songs s ON a.id = s.artist_id
                     WHERE a.user_id = ?
                     GROUP BY a.id
                     LIMIT 1"
                );
                $stmt->execute([$userId]);
                $artist = $stmt->fetch();

                if (!$artist) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Artist not found']);
                    break;
                }

                // Preserve legacy response shape used by the current dashboard code.
                echo json_encode(['success' => true, 'data' => [$artist]]);
                break;
            }

            $stmt = $pdo->query(
                "SELECT a.*,
                        u.name AS user_name,
                        u.email AS user_email,
                        COUNT(DISTINCT s.id) AS actual_songs_count,
                        COALESCE(SUM(s.plays), 0) AS total_plays,
                        COALESCE(SUM(s.likes), 0) AS total_likes,
                        COALESCE(SUM(s.downloads), 0) AS total_downloads
                 FROM artists a
                 LEFT JOIN users u ON a.user_id = u.id
                 LEFT JOIN songs s ON a.id = s.artist_id
                 GROUP BY a.id
                 ORDER BY a.id DESC"
            );
            $artists = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $artists]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        if (!$sessionUser) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentication required']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        try {
            $targetUserId = (int) ($data['user_id'] ?? 0);
            if ($targetUserId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid user_id is required']);
                break;
            }

            $targetUser = getUserById($pdo, $targetUserId);
            if (!$targetUser || ($targetUser['type'] ?? '') !== 'artist') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Artist user not found']);
                break;
            }

            $existingStmt = $pdo->prepare("SELECT id FROM artists WHERE user_id = ? LIMIT 1");
            $existingStmt->execute([$targetUserId]);
            if ($existingStmt->fetchColumn()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Artist profile already exists']);
                break;
            }

            $isAdminUser = isAdmin($sessionUser);
            $isSelfCreate = userOwnsArtist($sessionUser, $targetUserId);

            if (!$isAdminUser && !$isSelfCreate) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You cannot create an artist profile for another user']);
                break;
            }

            $payload = filterArtistPayload($data, [
                'name',
                'real_name',
                'genre',
                'bio',
                'image',
                'instagram_url',
                'twitter_url',
                'facebook_url',
                'youtube_url',
                'website',
                'location'
            ]);

            $name = $payload['name'] ?? trim((string) ($targetUser['name'] ?? ''));
            $genre = $payload['genre'] ?? 'Other';

            if ($name === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Artist name is required']);
                break;
            }

            $status = 'pending';
            $verification = 'pending';
            if ($isAdminUser) {
                $requestedStatus = normalizeArtistStatus((string) ($data['status'] ?? 'pending'));
                $requestedVerification = normalizeVerificationStatus((string) ($data['verification'] ?? 'pending'));
                if ($requestedStatus !== null) {
                    $status = $requestedStatus;
                }
                if ($requestedVerification !== null) {
                    $verification = $requestedVerification;
                }
            }

            $stmt = $pdo->prepare(
                "INSERT INTO artists (
                    user_id, name, real_name, genre, followers, songs_count, status, verification, bio, image,
                    instagram_url, twitter_url, facebook_url, youtube_url, website, location
                ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $targetUserId,
                $name,
                $payload['real_name'] ?? null,
                $genre,
                0,
                0,
                $status,
                $verification,
                $payload['bio'] ?? null,
                $payload['image'] ?? null,
                $payload['instagram_url'] ?? null,
                $payload['twitter_url'] ?? null,
                $payload['facebook_url'] ?? null,
                $payload['youtube_url'] ?? null,
                $payload['website'] ?? null,
                $payload['location'] ?? null
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Artist created successfully',
                'data' => ['id' => (int) $pdo->lastInsertId()]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'PUT':
        require_csrf_token();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        try {
            if (!$sessionUser) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Authentication required']);
                break;
            }

            $artistId = (int) ($data['id'] ?? 0);
            if ($artistId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Artist ID is required']);
                break;
            }

            $existingArtist = getArtistById($pdo, $artistId);
            if (!$existingArtist) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Artist not found']);
                break;
            }

            $ownerUserId = (int) $existingArtist['user_id'];
            $isAdminUser = isAdmin($sessionUser);
            $isOwner = userOwnsArtist($sessionUser, $ownerUserId);

            if (!$isAdminUser && !$isOwner) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You can only update your own artist profile']);
                break;
            }

            $allowedFields = [];
            if ($isOwner && $isAdminUser) {
                $allowedFields = ['name', 'real_name', 'genre', 'bio', 'image', 'instagram_url', 'twitter_url', 'facebook_url', 'youtube_url', 'website', 'location', 'status', 'verification'];
            } elseif ($isAdminUser) {
                $allowedFields = ['status', 'verification'];
            } else {
                $allowedFields = ['name', 'real_name', 'genre', 'bio', 'image', 'instagram_url', 'twitter_url', 'facebook_url', 'youtube_url', 'website', 'location'];
            }

            $payload = filterArtistPayload($data, $allowedFields);
            if (empty($payload)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
                break;
            }

            $fields = [];
            $values = [];

            foreach ($payload as $key => $value) {
                if ($key === 'status') {
                    $normalized = normalizeArtistStatus((string) $value);
                    if ($normalized === null) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Invalid artist status']);
                        break 2;
                    }
                    $value = $normalized;
                }

                if ($key === 'verification') {
                    $normalized = normalizeVerificationStatus((string) $value);
                    if ($normalized === null) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Invalid verification status']);
                        break 2;
                    }
                    $value = $normalized;
                }

                $fields[] = "$key = ?";
                $values[] = $value === '' ? null : $value;
            }

            $values[] = $artistId;
            $stmt = $pdo->prepare("UPDATE artists SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($values);

            echo json_encode(['success' => true, 'message' => 'Artist updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'DELETE':
        require_csrf_token();
        try {
            if (!isAdmin($sessionUser)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                break;
            }

            $artistId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            if ($artistId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Artist ID is required']);
                break;
            }

            $existingArtist = getArtistById($pdo, $artistId);
            if (!$existingArtist) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Artist not found']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM artists WHERE id = ?");
            $stmt->execute([$artistId]);
            echo json_encode(['success' => true, 'message' => 'Artist deleted successfully']);
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
