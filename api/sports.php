<?php
require_once 'config.php';
echo get_cached_data('/api/sports', 60); // Cache categories for 60 minutes
?>