<?php
/**
 * FOS Bar - Authentifizierung
 */

/**
 * Prüft ob der Benutzer eingeloggt ist
 */
function isAuthenticated() {
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

/**
 * Prüft Auth und gibt 401 zurück wenn nicht eingeloggt
 */
function requireAuth() {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht autorisiert', 'redirect' => 'login.php']);
        exit();
    }
}

/**
 * Login mit Passwort
 */
function login($password) {
    if ($password === APP_PASSWORD) {
        $_SESSION['authenticated'] = true;
        $_SESSION['login_time'] = time();
        return true;
    }
    return false;
}

/**
 * Logout
 */
function logout() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}
