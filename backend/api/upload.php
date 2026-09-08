<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../security.php';


// Disable error reporting to output to prevent JSON breakage
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Increase limits for large uploads
ini_set('upload_max_filesize', '64M');
ini_set('post_max_size', '64M');
ini_set('memory_limit', '256M');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Start session for authentication
secure_session_start();
require_csrf_token();

// Check if user is authenticated
if (!isset($_SESSION['user']) || !$_SESSION['user']['isLoggedIn']) {
    error_log("Upload failed: User not logged in");
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Debug logging disabled in production

require_once '../db.php';
require_once '../audio_duration.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = '../../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Create subdirectories for organization
$songsDir = $uploadDir . 'songs/';
$artworkDir = $uploadDir . 'artwork/';

if (!file_exists($songsDir)) {
    mkdir($songsDir, 0755, true);
}
if (!file_exists($artworkDir)) {
    mkdir($artworkDir, 0755, true);
}
$avatarsDir = $uploadDir . 'avatars/';
if (!file_exists($avatarsDir)) {
    mkdir($avatarsDir, 0755, true);
}

$response = ['success' => false, 'message' => ''];

function validatedUploadExtension(array $file, array $allowedMimeToExtension, int $maxBytes): string
{
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new Exception('Upload failed. Please try again.');
    }

    if (!is_uploaded_file($file['tmp_name'] ?? '')) {
        throw new Exception('Invalid upload source.');
    }

    if (($file['size'] ?? 0) <= 0 || $file['size'] > $maxBytes) {
        throw new Exception('Uploaded file exceeds the allowed size.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!isset($allowedMimeToExtension[$mime])) {
        throw new Exception('Invalid uploaded file type.');
    }

    return $allowedMimeToExtension[$mime];
}

function ensureArtistProfile(PDO $pdo, array $sessionUser): ?int
{
    $userId = (int) ($sessionUser['id'] ?? 0);
    if ($userId <= 0 || (($sessionUser['type'] ?? '') !== 'artist')) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT id FROM artists WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $artistId = $stmt->fetchColumn();
    if ($artistId !== false) {
        return (int) $artistId;
    }

    $userStmt = $pdo->prepare("SELECT name, avatar FROM users WHERE id = ? AND type = 'artist' LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    if (!$user) {
        return null;
    }

    $artistName = trim((string) ($user['name'] ?? ''));
    if ($artistName === '') {
        $artistName = 'New Artist';
    }

    $insertStmt = $pdo->prepare(
        "INSERT INTO artists (
            user_id, name, genre, followers, songs_count, status, verification, bio, image
        ) VALUES (?, ?, 'Other', 0, 0, 'pending', 'pending', '', ?)"
    );
    $insertStmt->execute([
        $userId,
        $artistName,
        !empty($user['avatar']) && strpos((string) $user['avatar'], 'uploads/') === 0
            ? $user['avatar']
            : null
    ]);

    return (int) $pdo->lastInsertId();
}

try {
    // Get upload type and metadata
    $uploadType = $_POST['upload_type'] ?? '';
    $title = trim($_POST['title'] ?? '');
    $genre = trim($_POST['genre'] ?? '');
    $requestedArtistId = isset($_POST['artist_id']) ? (int) $_POST['artist_id'] : 0;
    $artistId = null;

    // Validate required fields
    if (empty($uploadType)) {
        throw new Exception('Upload type is required');
    }

    // Resolve the current user's artist profile from the session rather than trusting the client.
    if (isset($_SESSION['user']['id'])) {
        $artistId = ensureArtistProfile($pdo, $_SESSION['user']);
    }

    if ($uploadType === 'song') {
        if (($_SESSION['user']['type'] ?? '') !== 'artist') {
            throw new Exception('Only artist accounts can upload songs');
        }

        if (empty($title) || empty($genre)) {
            throw new Exception('Title and genre are required for song uploads');
        }

        if (empty($artistId)) {
            throw new Exception('Artist profile not found for current user');
        }

        if ($requestedArtistId > 0 && $requestedArtistId !== $artistId) {
            throw new Exception('You can only upload songs to your own artist profile');
        }

        // Handle song file upload
        if (!isset($_FILES['song_file'])) {
            throw new Exception('Song file is required');
        }

        $songFile = $_FILES['song_file'];
        $allowedSongTypes = [
            'audio/mpeg' => 'mp3',
            'audio/x-wav' => 'wav',
            'audio/wav' => 'wav',
            'audio/ogg' => 'ogg',
            'application/ogg' => 'ogg'
        ];
        $maxSongSize = 50 * 1024 * 1024; // 50MB

        $songExtension = validatedUploadExtension($songFile, $allowedSongTypes, $maxSongSize);

        // Generate unique filename for song
        $songFilename = 'song_' . bin2hex(random_bytes(16)) . '.' . $songExtension;
        $songPath = $songsDir . $songFilename;

        // Move uploaded song file
        if (!move_uploaded_file($songFile['tmp_name'], $songPath)) {
            throw new Exception('Failed to save song file');
        }

        // Handle cover art if provided
        $coverArtPath = null;
        if (isset($_FILES['cover_art']) && $_FILES['cover_art']['error'] !== UPLOAD_ERR_NO_FILE) {
            $coverFile = $_FILES['cover_art'];
            $allowedImageTypes = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp'
            ];
            $maxImageSize = 5 * 1024 * 1024; // 5MB

            $coverExtension = validatedUploadExtension($coverFile, $allowedImageTypes, $maxImageSize);
            $coverFilename = 'cover_' . bin2hex(random_bytes(16)) . '.' . $coverExtension;
            $coverArtPath = $artworkDir . $coverFilename;

            if (!move_uploaded_file($coverFile['tmp_name'], $coverArtPath)) {
                // Don't fail the whole upload if cover art fails
                $coverArtPath = null;
            }
        }

        // Extract real duration from the uploaded audio file
        $durationSeconds = audio_duration_seconds($songPath);
        $duration = audio_duration_format($durationSeconds);

        // Insert song into database
        $stmt = $pdo->prepare("INSERT INTO songs (title, artist_id, genre, duration, file_path, cover_art, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())");
        $stmt->execute([
            $title,
            $artistId,
            $genre,
            $duration,
            'uploads/songs/' . $songFilename,
            $coverArtPath ? 'uploads/artwork/' . basename($coverArtPath) : null
        ]);

        $songId = $pdo->lastInsertId();

        $response = [
            'success' => true,
            'message' => 'Song uploaded successfully',
            'data' => [
                'cover_art' => $coverArtPath ? 'uploads/artwork/' . basename($coverArtPath) : null
            ]
        ];

    } elseif ($uploadType === 'profile_image') {
        // Handle profile image upload for the current user
        if (!isset($_FILES['profile_image'])) {
            throw new Exception('Profile image file is required');
        }

        $imageFile = $_FILES['profile_image'];
        $allowedImageTypes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        ];
        $maxImageSize = 5 * 1024 * 1024; // 5MB

        $extension = validatedUploadExtension($imageFile, $allowedImageTypes, $maxImageSize);
        $filename = 'artistimg_' . bin2hex(random_bytes(16)) . '.' . $extension;
        $artistImgPath = $avatarsDir . $filename;
        $webPath = 'uploads/avatars/' . $filename;

        if (!move_uploaded_file($imageFile['tmp_name'], $artistImgPath)) {
            throw new Exception('Failed to save profile image');
        }

        $userId = $_SESSION['user']['id'];

        // Always update the user's avatar.
        $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
        $stmt->execute([$webPath, $userId]);

        // If the user has an artist profile, keep the artist image in sync.
        $stmt = $pdo->prepare("SELECT id FROM artists WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $artist = $stmt->fetch();
        if ($artist) {
            $stmt = $pdo->prepare("UPDATE artists SET image = ? WHERE id = ?");
            $stmt->execute([$webPath, $artist['id']]);
        }

        $response = [
            'success' => true,
            'message' => 'Profile photo updated successfully',
            'data' => [
                'file_path' => $webPath
            ]
        ];

    } elseif ($uploadType === 'artwork') {
        // Handle standalone artwork upload
        if (!isset($_FILES['cover_art'])) {
            throw new Exception('Cover art file is required');
        }

        $coverFile = $_FILES['cover_art'];
        $allowedImageTypes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        ];
        $maxImageSize = 5 * 1024 * 1024; // 5MB

        $coverExtension = validatedUploadExtension($coverFile, $allowedImageTypes, $maxImageSize);
        $coverFilename = 'cover_' . bin2hex(random_bytes(16)) . '.' . $coverExtension;
        $coverArtPath = $artworkDir . $coverFilename;

        if (!move_uploaded_file($coverFile['tmp_name'], $coverArtPath)) {
            throw new Exception('Failed to save cover art file');
        }

        $response = [
            'success' => true,
            'message' => 'Cover art uploaded successfully',
            'data' => [
                'file_path' => 'uploads/artwork/' . $coverFilename
            ]
        ];

    } else {
        throw new Exception('Invalid upload type');
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];

    // Clean up uploaded files if something went wrong
    if (isset($songPath) && file_exists($songPath)) {
        unlink($songPath);
    }
    if (isset($coverArtPath) && file_exists($coverArtPath)) {
        unlink($coverArtPath);
    }
}

echo json_encode($response);
?>
