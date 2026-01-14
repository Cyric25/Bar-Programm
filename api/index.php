<?php
/**
 * FOS Bar - API Router
 *
 * Endpunkte:
 * GET/POST/DELETE ?action=products
 * GET/POST ?action=categories
 * GET/POST ?action=sales
 * GET/POST/DELETE ?action=persons
 * GET/POST/DELETE ?action=loyalty_card_types
 * GET/POST ?action=inventory
 * GET/POST/DELETE ?action=debtors
 * POST ?action=login
 * GET ?action=logout
 */

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

try {
    // Login/Logout brauchen keine Auth
    if ($action === 'login') {
        if ($method === 'POST') {
            $data = getRequestBody();
            if (login($data['password'] ?? '')) {
                jsonResponse(['success' => true]);
            } else {
                errorResponse('Falsches Passwort', 401);
            }
        }
        exit();
    }

    if ($action === 'logout') {
        logout();
        jsonResponse(['success' => true]);
        exit();
    }

    // Alle anderen Aktionen brauchen Auth
    requireAuth();

    switch ($action) {
        // ============ PRODUCTS ============
        case 'products':
            if ($method === 'GET') {
                jsonResponse($db->getProducts());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if (isset($data[0])) {
                    // Array von Produkten
                    $db->saveProducts($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelnes Produkt
                    jsonResponse($db->saveProduct($data));
                }
            } elseif ($method === 'DELETE') {
                if (!$id) errorResponse('ID erforderlich', 400);
                $db->deleteProduct($id);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ CATEGORIES ============
        case 'categories':
            if ($method === 'GET') {
                jsonResponse($db->getCategories());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                $db->saveCategories($data);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ SALES ============
        case 'sales':
            if ($method === 'GET') {
                jsonResponse($db->getSales());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if (isset($data[0])) {
                    // Array von Sales (Import)
                    $db->saveSales($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelner Sale
                    jsonResponse($db->addSale($data));
                }
            }
            break;

        // ============ PERSONS ============
        case 'persons':
            if ($method === 'GET') {
                jsonResponse($db->getPersons());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if (isset($data[0])) {
                    // Array von Personen
                    $db->savePersons($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelne Person
                    jsonResponse($db->savePerson($data));
                }
            } elseif ($method === 'DELETE') {
                if (!$id) errorResponse('ID erforderlich', 400);
                $db->deletePerson($id);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ LOYALTY CARD TYPES ============
        case 'loyalty_card_types':
            if ($method === 'GET') {
                jsonResponse($db->getLoyaltyCardTypes());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if (isset($data[0])) {
                    // Array von Types
                    $db->saveLoyaltyCardTypes($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelner Type
                    jsonResponse($db->saveLoyaltyCardType($data));
                }
            } elseif ($method === 'DELETE') {
                if (!$id) errorResponse('ID erforderlich', 400);
                $db->deleteLoyaltyCardType($id);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ INVENTORY ============
        case 'inventory':
            if ($method === 'GET') {
                jsonResponse($db->getInventory());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if (isset($data[0])) {
                    // Array von Einträgen
                    $db->saveInventory($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelner Eintrag
                    jsonResponse($db->addInventoryEntry($data));
                }
            }
            break;

        // ============ DEBTORS ============
        case 'debtors':
            if ($method === 'GET') {
                jsonResponse($db->getDebtors());
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if (isset($data[0])) {
                    // Array von Schuldnern
                    $db->saveDebtors($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelner Schuldner
                    jsonResponse($db->saveDebtor($data));
                }
            } elseif ($method === 'DELETE') {
                if (!$id) errorResponse('ID erforderlich', 400);
                $db->deleteDebtor($id);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ STATUS ============
        case 'status':
            jsonResponse([
                'status' => 'ok',
                'version' => '1.0.0',
                'database' => file_exists(DB_PATH) ? 'connected' : 'not found'
            ]);
            break;

        default:
            errorResponse('Unbekannte Aktion: ' . $action, 404);
    }
} catch (PDOException $e) {
    errorResponse('Datenbankfehler: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    errorResponse('Fehler: ' . $e->getMessage(), 500);
}
