<?php
/**
 * AfroRhythm Database Setup Script
 * Automates the creation of the database and its tables.
 */

$isLocalRequest = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
$setupEnabled = getenv('ALLOW_WEB_SETUP') === 'true';
if (PHP_SAPI !== 'cli' && (!$isLocalRequest || !$setupEnabled)) {
    http_response_code(404);
    exit('Not found');
}

// Error reporting for setup
error_reporting(E_ALL);
ini_set('display_errors', 1);

function setup_env(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }

    static $envVars = null;
    if ($envVars === null) {
        $envVars = [];
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$k, $v] = explode('=', $line, 2);
                $envVars[trim($k)] = trim($v);
            }
        }
    }

    return $envVars[$key] ?? $default;
}

// Configuration - Load from db.php if possible
$db_config_file = __DIR__ . '/db.php';
$host = 'localhost';
$dbname = 'music_app';
$username = 'root';
$password = '';

if (file_exists($db_config_file)) {
    // We read it as text to extract variables without actually executing if it fails
    $content = file_get_contents($db_config_file);
    if (preg_match('/\$host\s*=\s*\'(.*)\'/', $content, $matches))
        $host = $matches[1];
    if (preg_match('/\$dbname\s*=\s*\'(.*)\'/', $content, $matches))
        $dbname = $matches[1];
    if (preg_match('/\$username\s*=\s*\'(.*)\'/', $content, $matches))
        $username = $matches[1];
    if (preg_match('/\$password\s*=\s*\'(.*)\'/', $content, $matches))
        $password = $matches[1];
}

$status = [];
$success = false;

if (isset($_POST['run_setup'])) {
    try {
        $adminName = setup_env('ADMIN_NAME', 'System Admin');
        $adminEmail = setup_env('ADMIN_EMAIL', 'camsound@gmail.com');
        $adminPassword = setup_env('ADMIN_PASSWORD', 'CMR@music237');

        // 1. Connect to MySQL (without database)
        $pdo = new PDO("mysql:host=$host", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        $status[] = "✅ Connected to MySQL server.";

        // 2. Create Database
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $status[] = "✅ Database `$dbname` checked/created.";

        // 3. Connect to the specific database
        $pdo->exec("USE `$dbname` ");
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // 4. Import Schema
        $sqlFile = __DIR__ . '/../database_schema_utf8.sql';
        if (!file_exists($sqlFile)) {
            $sqlFile = __DIR__ . '/../database_schema.sql';
        }

        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);

            // Remove UTF-8 BOM if present
            $sql = preg_replace('/^\xEF\xBB\xBF/', '', $sql);

            // If it's the UTF-16 version, we might need to convert it
            if (substr($sql, 0, 2) == "\xFF\xFE" || substr($sql, 0, 2) == "\xFE\xFF") {
                $sql = mb_convert_encoding($sql, 'UTF-8', 'UTF-16');
            }

            // Split by semicolon and execute
            // This is a simple split, might fail on semicolons in strings, 
            // but usually works for standard dumps
            $queries = explode(';', $sql);
            $queryCount = 0;
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    $pdo->exec($query);
                    $queryCount++;
                }
            }
            $status[] = "✅ $queryCount SQL commands executed from `" . basename($sqlFile) . "`.";
        } else {
            $status[] = "⚠️ Warning: Schema file not found. Skipping SQL import.";
        }

        // 5. Ensure client_storage table exists (Dynamic table)
        $pdo->exec("CREATE TABLE IF NOT EXISTS client_storage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT NULL,
            storage_key VARCHAR(191) NOT NULL,
            storage_value LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY user_key (user_id, storage_key)
        )");
        // 6. Seed the initial admin account only
        $adminPasswordHash = password_hash($adminPassword, PASSWORD_BCRYPT);
        $demo_users = [
            ['name' => $adminName, 'email' => $adminEmail, 'type' => 'admin', 'password_hash' => $adminPasswordHash]
        ];

        foreach ($demo_users as $user) {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, type, status, joined) VALUES (?, ?, ?, ?, 'active', CURDATE()) ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), status='active', type=VALUES(type)");
            $stmt->execute([$user['name'], $user['email'], $user['password_hash'], $user['type']]);
        }

        $status[] = "✅ Initial admin account seeded.";
        $status[] = "🔐 Admin account: " . htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8');
        $status[] = "🎉 Setup completed successfully!";
        $success = true;

    } catch (PDOException $e) {
        $status[] = "❌ Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AfroRhythm | Database Setup</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #ff3d00;
            --dark-bg: #121212;
            --surface-color: #1e1e1e;
        }

        body {
            background-color: var(--dark-bg);
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }

        .setup-card {
            background-color: var(--surface-color);
            border: 1px solid #333;
            border-radius: 16px;
            padding: 2.5rem;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .logo {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--primary-color);
            text-align: center;
            margin-bottom: 0.5rem;
            letter-spacing: -1px;
        }

        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 2rem;
        }

        .status-box {
            background: #000;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
            border-left: 4px solid var(--primary-color);
        }

        .status-item {
            margin-bottom: 0.5rem;
        }

        .btn-primary {
            background-color: var(--primary-color);
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            background-color: #e63600;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background-color: #333;
            border: none;
            width: 100%;
            padding: 12px 24px;
            border-radius: 8px;
            margin-top: 1rem;
        }

        .success-icon {
            font-size: 4rem;
            color: #4caf50;
            text-align: center;
            display: block;
            margin-bottom: 1.5rem;
        }
    </style>
</head>

<body>
    <div class="setup-card">
        <div class="logo">AfroRythm</div>
        <p class="subtitle">Database Configuration & Initialization</p>

        <?php if ($success): ?>
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 class="text-center mb-4">Setup Complete!</h3>
            <div class="status-box">
                <?php foreach ($status as $line): ?>
                    <div class="status-item"><?php echo $line; ?></div>
                <?php endforeach; ?>
            </div>
            <a href="../index.html" class="btn btn-primary">Go to Homepage</a>
            <a href="../auth/login.html" class="btn btn-secondary">Login to Dashboard</a>
        <?php else: ?>
            <p class="mb-4">This script will initialize your MySQL database. It will:</p>
            <ul class="mb-4">
                <li>Create the <strong><?php echo htmlspecialchars($dbname); ?></strong> database</li>
                <li>Import all tables from <strong>database_schema.sql</strong></li>
                <li>Setup the system for first-time use</li>
            </ul>

            <?php if (!empty($status)): ?>
                <div class="status-box">
                    <?php foreach ($status as $line): ?>
                        <div class="status-item"><?php echo $line; ?></div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <form method="POST">
                <button type="submit" name="run_setup" class="btn btn-primary">
                    <i class="fas fa-rocket me-2"></i> Run Database Setup
                </button>
            </form>
            <p class="mt-3 text-center small text-muted">
                Make sure XAMPP MySQL is running before starting.
            </p>
        <?php endif; ?>
    </div>
</body>

</html>
