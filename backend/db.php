<?php
// Database configuration — load from .env if present, fall back to defaults for local dev
function _env(string $key, string $default = ''): string
{
    $val = getenv($key);
    if ($val !== false)
        return $val;
    // Parse .env file relative to project root (two levels up from /backend/)
    static $envVars = null;
    if ($envVars === null) {
        $envVars = [];
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                if (str_starts_with(trim($line), '#') || !str_contains($line, '='))
                    continue;
                [$k, $v] = explode('=', $line, 2);
                $envVars[trim($k)] = trim($v);
            }
        }
    }
    return $envVars[$key] ?? $default;
}

$host = _env('DB_HOST', 'localhost');
$dbname = _env('DB_NAME', 'music_app');
$username = _env('DB_USER', 'root');
$password = _env('DB_PASS', '');

function ensure_table_columns(PDO $pdo, string $table, array $requiredColumns): void
{
    static $checkedTables = [];

    if (isset($checkedTables[$table])) {
        return;
    }

    $checkedTables[$table] = true;

    try {
        $existsStmt = $pdo->prepare('SHOW TABLES LIKE ?');
        $existsStmt->execute([$table]);
        if (!$existsStmt->fetchColumn()) {
            return;
        }

        $columns = $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_COLUMN, 0);
        foreach ($requiredColumns as $column => $definition) {
            if (!in_array($column, $columns, true)) {
                $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
            }
        }
    } catch (Throwable $e) {
        error_log('Schema compatibility check failed for table ' . $table . ': ' . $e->getMessage());
    }
}

function ensure_schema_compatibility(PDO $pdo): void
{
    ensure_table_columns($pdo, 'songs', [
        'downloads' => 'INT(11) NOT NULL DEFAULT 0 AFTER `likes`'
    ]);

    ensure_table_columns($pdo, 'artists', [
        'real_name' => 'VARCHAR(255) DEFAULT NULL AFTER `name`',
        'website' => 'VARCHAR(255) DEFAULT NULL AFTER `youtube_url`',
        'location' => 'VARCHAR(255) DEFAULT NULL AFTER `website`',
        'image' => 'VARCHAR(500) DEFAULT NULL AFTER `bio`'
    ]);
    
    ensure_table_columns($pdo, 'notifications', [
        'type' => "VARCHAR(50) DEFAULT 'system' AFTER `message` ",
        'target_id' => 'INT DEFAULT NULL AFTER `type` '
    ]);
}

try {
    // Changed charset to utf8mb4 to match database creation schema
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    ensure_schema_compatibility($pdo);
} catch (PDOException $e) {
    if (
        strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false ||
        strpos($_SERVER['PHP_SELF'] ?? '', '/api/') !== false ||
        (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    ) {

        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        if (ob_get_length())
            ob_clean();

        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Please ensure MySQL is running.'
        ]);
        exit;
    }
    die("Connection failed. Please ensure MySQL is running in XAMPP.");
}