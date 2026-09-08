<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../security.php';
require_once '../db.php';

secure_session_start();

function logError($e){
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
    $file = $logDir . '/error.log';
    @file_put_contents($file, date('Y-m-d H:i:s') . " - " . $e->getMessage() . PHP_EOL, FILE_APPEND);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['action']) || empty($data['id'])){
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Invalid request']);
    exit;
}

$action = $data['action'];
$id = (int)$data['id'];

try{
    if ($action === 'play'){
        // increment plays (allowed for anonymous)
        $stmt = $pdo->prepare("UPDATE songs SET plays = plays + 1 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success'=>true,'message'=>'Play recorded']);
        exit;
    }

    if ($action === 'download'){
        // increment downloads
        $stmt = $pdo->prepare("UPDATE songs SET downloads = downloads + 1 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success'=>true,'message'=>'Download recorded']);
        exit;
    }

    if ($action === 'history'){
        require_csrf_token();
        // History writes must be tied to the authenticated session user only.
        $user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
        if ($user_id){
            $stmt = $pdo->prepare("INSERT INTO listening_history (user_id, song_id) VALUES (?, ?)");
            $stmt->execute([$user_id, $id]);
            echo json_encode(['success'=>true,'message'=>'History saved']);
            exit;
        } else {
            http_response_code(403);
            echo json_encode(['success'=>false,'message'=>'No authenticated user']);
            exit;
        }
    }

    echo json_encode(['success'=>false,'message'=>'Unknown action']);
}catch(PDOException $e){
    logError($e);
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error']);
}

?>
