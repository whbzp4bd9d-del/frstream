<?php
require_once 'config.php';
$category = $_GET['cat'] ?? 'live';
echo get_cached_data("/api/matches/{$category}");
?>