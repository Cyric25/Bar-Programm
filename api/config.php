<?php
/**
 * FOS Bar - Konfigurationsdatei
 */

// Fehleranzeige (für Entwicklung - auf Produktion ausschalten)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Datenbank-Pfad
define('DB_PATH', __DIR__ . '/db/fos_bar.sqlite');

// CORS-Header für API-Zugriff
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS-Request für CORS-Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * JSON-Antwort senden
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Fehler-Antwort senden
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

/**
 * Request-Body als JSON lesen
 */
function getRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}
