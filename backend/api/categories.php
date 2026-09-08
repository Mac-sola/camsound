<?php
header('Content-Type: application/json');
require_once '../cors.php';

require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function handleGet() {
    global $pdo;
    try {
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
        $categories = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $categories]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
