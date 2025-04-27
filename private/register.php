<?php
error_log("register.php script called"); // Debugging
include 'db_connection.php';

header('Content-Type: application/json'); // Ensure the response is JSON

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = htmlspecialchars($_POST['username']);
    $email = htmlspecialchars($_POST['email']);
    $password = $_POST['password'];

    error_log("Form data received: Username=$username, Email=$email"); // Debugging

    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)");
        $stmt->execute([
            ':username' => $username,
            ':email' => $email,
            ':password_hash' => $password_hash,
        ]);
        error_log("User registered successfully: Username=$username, Email=$email"); // Debugging
        echo json_encode(['status' => 'success', 'message' => 'Registration successful!']);
    } catch (PDOException $e) {
        error_log("SQL error: " . $e->getMessage()); // Debugging
        echo json_encode(['status' => 'error', 'message' => 'Registration failed: ' . $e->getMessage()]);
    }
} else {
    error_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']); // Debugging
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
}
?>