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
 * Gibt aktuellen Benutzer zurück
 */
function getCurrentUser() {
    if (!isAuthenticated()) return null;
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? null,
        'display_name' => $_SESSION['display_name'] ?? null,
        'role' => $_SESSION['role'] ?? 'staff'
    ];
}

/**
 * Prüft ob Benutzer Admin ist
 */
function isAdmin() {
    return isAuthenticated() && ($_SESSION['role'] ?? '') === 'admin';
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
 * Prüft Admin-Rechte
 */
function requireAdmin() {
    requireAuth();
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(['error' => 'Keine Berechtigung']);
        exit();
    }
}

/**
 * Login mit Benutzername und Passwort
 */
function loginUser($username, $password, $db) {
    $user = $db->verifyUserPassword($username, $password);
    if ($user) {
        $_SESSION['authenticated'] = true;
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['display_name'] = $user['display_name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['login_time'] = time();

        // Log activity
        $db->logActivity($user['id'], $user['username'], 'login', ['ip' => $_SERVER['REMOTE_ADDR'] ?? null]);

        return $user;
    }
    return false;
}

/**
 * Fallback: Login nur mit Passwort (Kompatibilität)
 */
function login($password) {
    if ($password === APP_PASSWORD) {
        $_SESSION['authenticated'] = true;
        $_SESSION['login_time'] = time();
        $_SESSION['username'] = 'legacy';
        $_SESSION['role'] = 'admin';
        return true;
    }
    return false;
}

/**
 * Logout
 */
function logout($db = null) {
    if ($db && isAuthenticated()) {
        $db->logActivity(
            $_SESSION['user_id'] ?? null,
            $_SESSION['username'] ?? 'unknown',
            'logout'
        );
    }

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
