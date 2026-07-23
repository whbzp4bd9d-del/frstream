<?php
require_once 'config.php';
$source = $_GET['source'] ?? '';
$id = $_GET['id'] ?? '';

if (!$source || !$id) {
    echo json_encode(['error' => 'Missing source or ID']);
    exit;
}

// Cache streams for a shorter time (1 minute) since live links can change
echo get_cached_data("/api/stream/{$source}/{$id}", 1); 
?>