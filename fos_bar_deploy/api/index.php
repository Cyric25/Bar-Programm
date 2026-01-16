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
 * GET/POST/DELETE ?action=users (Admin only)
 * GET ?action=activity_log (Admin only)
 * GET/POST ?action=settings
 * GET/POST ?action=preorders
 * GET/POST ?action=preorder_products
 * GET ?action=me (aktueller Benutzer)
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

            // Neuer Login mit Benutzername/Passwort
            if (isset($data['username']) && isset($data['password'])) {
                $user = loginUser($data['username'], $data['password'], $db);
                if ($user) {
                    jsonResponse(['success' => true, 'user' => $user]);
                } else {
                    errorResponse('Falscher Benutzername oder Passwort', 401);
                }
            }
            // Fallback: Nur Passwort (Kompatibilität)
            elseif (isset($data['password'])) {
                if (login($data['password'])) {
                    jsonResponse(['success' => true]);
                } else {
                    errorResponse('Falsches Passwort', 401);
                }
            } else {
                errorResponse('Benutzername und Passwort erforderlich', 400);
            }
        }
        exit();
    }

    if ($action === 'logout') {
        logout($db);
        jsonResponse(['success' => true]);
        exit();
    }

    // Aktueller Benutzer (ohne Auth - gibt null zurück wenn nicht eingeloggt)
    if ($action === 'me') {
        $user = getCurrentUser();
        jsonResponse(['user' => $user, 'authenticated' => $user !== null]);
        exit();
    }

    // Öffentliche Preorder-Endpoints (für Kunden)
    if ($action === 'public_preorder') {
        if ($method === 'GET') {
            // Verfügbare Produkte für Vorbestellung
            $settings = $db->getSetting('preorder_settings', [
                'enabled' => false,
                'start_time' => '08:00',
                'end_time' => '10:00'
            ]);

            if (!$settings['enabled']) {
                jsonResponse(['enabled' => false, 'message' => 'Vorbestellungen sind derzeit nicht möglich']);
                exit();
            }

            // Prüfe Zeitfenster
            $now = date('H:i');
            $inTimeWindow = $now >= $settings['start_time'] && $now <= $settings['end_time'];

            $products = [];
            if ($inTimeWindow) {
                $allProducts = $db->getProducts();
                $preorderProducts = $db->getPreorderProducts();

                foreach ($allProducts as $product) {
                    if (isset($preorderProducts[$product['id']]) && $preorderProducts[$product['id']]['isAvailable']) {
                        $product['maxQuantity'] = $preorderProducts[$product['id']]['maxQuantity'];
                        $products[] = $product;
                    }
                }
            }

            jsonResponse([
                'enabled' => true,
                'inTimeWindow' => $inTimeWindow,
                'startTime' => $settings['start_time'],
                'endTime' => $settings['end_time'],
                'products' => $products
            ]);
        } elseif ($method === 'POST') {
            // Vorbestellung aufgeben
            $data = getRequestBody();
            if (empty($data['customerName']) || empty($data['items'])) {
                errorResponse('Name und Bestellungen erforderlich', 400);
            }

            $settings = $db->getSetting('preorder_settings', ['enabled' => false]);
            if (!$settings['enabled']) {
                errorResponse('Vorbestellungen sind derzeit nicht möglich', 403);
            }

            $order = $db->createPreorder($data);
            jsonResponse(['success' => true, 'order' => $order]);
        }
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
                // Prüfe ob es ein Array ist (auch leeres Array)
                if (is_array($data) && (empty($data) || isset($data[0]))) {
                    // Array von Sales (Import oder clearTodaySales)
                    $db->saveSales($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelner Sale (hat 'name' oder 'productName' key)
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
                // Prüfe ob es ein Array ist (auch leeres Array)
                if (is_array($data) && (empty($data) || isset($data[0]))) {
                    // Array von Personen
                    $db->savePersons($data);
                    jsonResponse(['success' => true]);
                } else {
                    // Einzelne Person (hat 'name' key)
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

        // ============ USERS (Admin only) ============
        case 'users':
            requireAdmin();
            if ($method === 'GET') {
                if ($id) {
                    $user = $db->getUserById($id);
                    if (!$user) errorResponse('Benutzer nicht gefunden', 404);
                    jsonResponse($user);
                } else {
                    jsonResponse($db->getUsers());
                }
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if ($id) {
                    // Update
                    $user = $db->updateUser($id, $data);
                    $db->logActivity($_SESSION['user_id'], $_SESSION['username'], 'user_updated', ['target_user' => $id]);
                    jsonResponse($user);
                } else {
                    // Create
                    if (empty($data['username']) || empty($data['password'])) {
                        errorResponse('Benutzername und Passwort erforderlich', 400);
                    }
                    $user = $db->createUser($data);
                    $db->logActivity($_SESSION['user_id'], $_SESSION['username'], 'user_created', ['target_user' => $user['id']]);
                    jsonResponse($user);
                }
            } elseif ($method === 'DELETE') {
                if (!$id) errorResponse('ID erforderlich', 400);
                // Verhindere Selbstlöschung
                if ($id === $_SESSION['user_id']) {
                    errorResponse('Sie können sich nicht selbst löschen', 400);
                }
                $db->deleteUser($id);
                $db->logActivity($_SESSION['user_id'], $_SESSION['username'], 'user_deleted', ['target_user' => $id]);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ ACTIVITY LOG (Admin only) ============
        case 'activity_log':
            requireAdmin();
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $userId = $_GET['user_id'] ?? null;
            jsonResponse($db->getActivityLog($limit, $offset, $userId));
            break;

        // ============ SETTINGS ============
        case 'settings':
            if ($method === 'GET') {
                $key = $_GET['key'] ?? null;
                if ($key) {
                    jsonResponse(['key' => $key, 'value' => $db->getSetting($key)]);
                } else {
                    jsonResponse($db->getAllSettings());
                }
            } elseif ($method === 'POST') {
                requireAdmin();
                $data = getRequestBody();
                if (!isset($data['key']) || !isset($data['value'])) {
                    errorResponse('key und value erforderlich', 400);
                }
                $db->setSetting($data['key'], $data['value']);
                $db->logActivity($_SESSION['user_id'], $_SESSION['username'], 'setting_changed', ['key' => $data['key']]);
                jsonResponse(['success' => true]);
            }
            break;

        // ============ PREORDERS ============
        case 'preorders':
            if ($method === 'GET') {
                $status = $_GET['status'] ?? null;
                jsonResponse($db->getPreorders($status));
            } elseif ($method === 'POST') {
                $data = getRequestBody();
                if ($id) {
                    // Update Status
                    if (!isset($data['status'])) errorResponse('status erforderlich', 400);
                    $db->updatePreorderStatus($id, $data['status']);
                    $db->logActivity($_SESSION['user_id'], $_SESSION['username'], 'preorder_status_changed', ['order_id' => $id, 'status' => $data['status']]);
                    jsonResponse(['success' => true]);
                } else {
                    // Create (für Staff)
                    $order = $db->createPreorder($data);
                    jsonResponse($order);
                }
            }
            break;

        // ============ PREORDER PRODUCTS ============
        case 'preorder_products':
            if ($method === 'GET') {
                jsonResponse($db->getPreorderProducts());
            } elseif ($method === 'POST') {
                requireAdmin();
                $data = getRequestBody();
                if (!isset($data['productId'])) errorResponse('productId erforderlich', 400);
                $db->setPreorderProduct(
                    $data['productId'],
                    $data['isAvailable'] ?? true,
                    $data['maxQuantity'] ?? 10
                );
                jsonResponse(['success' => true]);
            }
            break;

        // ============ STATUS ============
        case 'status':
            $user = getCurrentUser();
            jsonResponse([
                'status' => 'ok',
                'version' => '2.0.0',
                'database' => file_exists(DB_PATH) ? 'connected' : 'not found',
                'user' => $user
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
