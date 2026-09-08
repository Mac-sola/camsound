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

function getPlaylistById(PDO $pdo, int $playlistId): ?array
{
    $stmt = $pdo->prepare("
        SELECT p.*, u.name AS creator_name,
               COUNT(ps.song_id) AS song_count
        FROM playlists p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
        WHERE p.id = ?
        GROUP BY p.id, u.name
        LIMIT 1
    ");
    $stmt->execute([$playlistId]);
    $playlist = $stmt->fetch();
    return $playlist ?: null;
}

function canAccessPlaylist(?array $user, array $playlist): bool
{
    if ((int) ($playlist['is_public'] ?? 0) === 1) {
        return true;
    }

    if (!$user) {
        return false;
    }

    return isAdmin($user) || (int) ($playlist['user_id'] ?? 0) === (int) ($user['id'] ?? 0);
}

function canModifyPlaylist(?array $user, array $playlist): bool
{
    if (!$user) {
        return false;
    }

    return isAdmin($user) || (int) ($playlist['user_id'] ?? 0) === (int) ($user['id'] ?? 0);
}

$method = $_SERVER['REQUEST_METHOD'];
$sessionUser = currentUser();

switch ($method) {
    case 'GET':
        try {
            $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
            $playlistId = isset($_GET['playlist_id']) ? (int) $_GET['playlist_id'] : (isset($_GET['id']) ? (int) $_GET['id'] : 0);
            $type = $_GET['type'] ?? '';

            if ($playlistId > 0) {
                $playlist = getPlaylistById($pdo, $playlistId);
                if (!$playlist) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Playlist not found']);
                    exit;
                }

                if (!canAccessPlaylist($sessionUser, $playlist)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    exit;
                }

                $stmt = $pdo->prepare("
                    SELECT s.*, a.name AS artist_name, ps.added_at
                    FROM playlist_songs ps
                    JOIN songs s ON ps.song_id = s.id
                    LEFT JOIN artists a ON s.artist_id = a.id
                    WHERE ps.playlist_id = ?
                    ORDER BY ps.added_at ASC
                ");
                $stmt->execute([$playlistId]);
                $playlist['songs'] = $stmt->fetchAll();

                echo json_encode(['success' => true, 'data' => $playlist]);
                break;
            }

            if ($type === 'public') {
                $stmt = $pdo->query("
                    SELECT p.*, u.name AS creator_name,
                           COUNT(ps.song_id) AS song_count
                    FROM playlists p
                    LEFT JOIN users u ON p.user_id = u.id
                    LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                    WHERE p.is_public = 1
                    GROUP BY p.id, u.name
                    ORDER BY p.created_at DESC
                    LIMIT 20
                ");
                $playlists = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $playlists]);
                break;
            }

            if ($userId > 0) {
                requireAuthenticatedUser($sessionUser);
                if (!isAdmin($sessionUser) && $userId !== (int) ($sessionUser['id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    break;
                }

                $stmt = $pdo->prepare("
                    SELECT p.*, u.name AS creator_name,
                           COUNT(ps.song_id) AS song_count
                    FROM playlists p
                    LEFT JOIN users u ON p.user_id = u.id
                    LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                    WHERE p.user_id = ? OR p.is_public = 1
                    GROUP BY p.id, u.name
                    ORDER BY p.created_at DESC
                ");
                $stmt->execute([$userId]);
                $playlists = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $playlists]);
                break;
            }

            $stmt = $pdo->query("
                SELECT p.*, u.name AS creator_name,
                       COUNT(ps.song_id) AS song_count
                FROM playlists p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.is_public = 1
                GROUP BY p.id, u.name
                ORDER BY p.created_at DESC
            ");
            $playlists = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $playlists]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
        }
        break;

    case 'POST':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        if (isset($data['playlist_id']) && isset($data['song_id'])) {
            try {
                $playlistId = (int) $data['playlist_id'];
                $songId = (int) $data['song_id'];
                $playlist = getPlaylistById($pdo, $playlistId);

                if (!$playlist) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Playlist not found']);
                    exit;
                }

                if (!canModifyPlaylist($sessionUser, $playlist)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Forbidden']);
                    exit;
                }

                $stmt = $pdo->prepare("SELECT id FROM playlist_songs WHERE playlist_id = ? AND song_id = ?");
                $stmt->execute([$playlistId, $songId]);
                if ($stmt->fetch()) {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'message' => 'Song already in playlist']);
                    exit;
                }

                $stmt = $pdo->prepare("INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)");
                $stmt->execute([$playlistId, $songId]);
                echo json_encode(['success' => true, 'message' => 'Song added to playlist']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Server error']);
            }
        } else {
            $requestedUserId = (int) ($data['user_id'] ?? 0);
            $name = trim((string) ($data['name'] ?? ''));
            $description = trim((string) ($data['description'] ?? ''));
            $isPublic = !empty($data['is_public']) ? 1 : 0;
            $effectiveUserId = (int) ($sessionUser['id'] ?? 0);

            if ($name === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Playlist name is required']);
                exit;
            }

            if ($requestedUserId > 0 && !isAdmin($sessionUser) && $requestedUserId !== $effectiveUserId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit;
            }

            if (isAdmin($sessionUser) && $requestedUserId > 0) {
                $effectiveUserId = $requestedUserId;
            }

            try {
                $stmt = $pdo->prepare("INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)");
                $stmt->execute([$effectiveUserId, $name, $description, $isPublic]);
                $playlistId = (int) $pdo->lastInsertId();

                if (isset($data['songs']) && is_array($data['songs'])) {
                    $stmt = $pdo->prepare("INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)");
                    foreach ($data['songs'] as $songId) {
                        $stmt->execute([$playlistId, (int) $songId]);
                    }
                }

                echo json_encode(['success' => true, 'message' => 'Playlist created successfully', 'data' => ['id' => $playlistId]]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Server error']);
            }
        }
        break;

    case 'PUT':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $playlistId = (int) ($data['playlist_id'] ?? 0);

        if ($playlistId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'playlist_id is required']);
            exit;
        }

        $playlist = getPlaylistById($pdo, $playlistId);
        if (!$playlist) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Playlist not found']);
            exit;
        }

        if (!canModifyPlaylist($sessionUser, $playlist)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit;
        }

        if (($data['action'] ?? '') === 'remove_song' && isset($data['song_id'])) {
            try {
                $stmt = $pdo->prepare("DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?");
                $stmt->execute([$playlistId, (int) $data['song_id']]);
                echo json_encode(['success' => true, 'message' => 'Song removed from playlist']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Server error']);
            }
        } else {
            try {
                $updates = [];
                $params = [];

                if (isset($data['name'])) {
                    $updates[] = "name = ?";
                    $params[] = trim((string) $data['name']);
                }
                if (isset($data['description'])) {
                    $updates[] = "description = ?";
                    $params[] = trim((string) $data['description']);
                }
                if (isset($data['is_public'])) {
                    $updates[] = "is_public = ?";
                    $params[] = $data['is_public'] ? 1 : 0;
                }

                if (empty($updates)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'No fields to update']);
                    exit;
                }

                $params[] = $playlistId;
                $stmt = $pdo->prepare("UPDATE playlists SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);

                echo json_encode(['success' => true, 'message' => 'Playlist updated successfully']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Server error']);
            }
        }
        break;

    case 'DELETE':
        require_csrf_token();
        requireAuthenticatedUser($sessionUser);
        $playlistId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($playlistId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Playlist ID is required']);
            exit;
        }

        $playlist = getPlaylistById($pdo, $playlistId);
        if (!$playlist) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Playlist not found']);
            exit;
        }

        if (!canModifyPlaylist($sessionUser, $playlist)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM playlists WHERE id = ?");
            $stmt->execute([$playlistId]);
            echo json_encode(['success' => true, 'message' => 'Playlist deleted successfully']);
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
