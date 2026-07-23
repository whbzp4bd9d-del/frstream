<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>PHP Environment Check</h2>";

echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>cURL Enabled:</strong> " . (function_exists('curl_version') ? 'Yes' : 'No') . "</p>";

$cache_dir = __DIR__ . '/cache/';
echo "<p><strong>Cache Dir Exists:</strong> " . (is_dir($cache_dir) ? 'Yes' : 'No') . "</p>";
echo "<p><strong>Cache Dir Writable:</strong> " . (is_writable($cache_dir) ? 'Yes' : 'No') . "</p>";

if (!is_writable($cache_dir)) {
    echo "<p style='color:red'><strong>ERROR:</strong> Cache folder is not writable! Set permissions to 755 or 777</p>";
}
?>