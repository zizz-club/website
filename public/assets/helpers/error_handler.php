<?php
function log_error($message) {
    $log_file = __DIR__ . '/../../logs/error.log'; // Define the log file path inside the function
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message" . PHP_EOL;

    // Ensure the logs directory exists
    if (!file_exists(dirname($log_file))) {
        mkdir(dirname($log_file), 0777, true);
    }

    // Append the error message to the log file
    file_put_contents($log_file, $log_message, FILE_APPEND);
}
?>