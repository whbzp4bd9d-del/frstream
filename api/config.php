<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function get_cached_data($endpoint, $cache_minutes = 5) {
    $cache_dir = __DIR__ . '/../cache/';
    if (!is_dir($cache_dir)) { mkdir($cache_dir, 0755, true); }
    
    $cache_file = $cache_dir . md5($endpoint) . '.json';
    $cache_time = $cache_minutes * 60;

    // Return cached file if it exists and is fresh
    if (file_exists($cache_file) && (time() - filemtime($cache_file) < $cache_time)) {
        return file_get_contents($cache_file);
    }

    // Fetch from Streamed.PK
    $ch = curl_init("https://streamed.pk{$endpoint}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Save to cache if successful
    if ($http_code === 200 && $response) {
        file_put_contents($cache_file, $response);
        return $response;
    }

    // Fallback to old cache if API fails
    if (file_exists($cache_file)) {
        return file_get_contents($cache_file);
    }

    return json_encode(['error' => 'API unavailable']);
}
?>