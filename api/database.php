<?php
/**
 * FOS Bar - Datenbank-Klasse
 */

require_once __DIR__ . '/config.php';

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $dbDir = dirname(DB_PATH);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        $this->pdo = new PDO('sqlite:' . DB_PATH);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        $this->initTables();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getPdo() {
        return $this->pdo;
    }

    private function addColumnIfNotExists($table, $column, $definition) {
        $stmt = $this->pdo->query("PRAGMA table_info($table)");
        $columns = $stmt->fetchAll();
        $columnExists = false;
        foreach ($columns as $col) {
            if ($col['name'] === $column) {
                $columnExists = true;
                break;
            }
        }
        if (!$columnExists) {
            $this->pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        }
    }

    private function initTables() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                category TEXT,
                sort_order INTEGER DEFAULT 0
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                color TEXT DEFAULT '#3b82f6'
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                timestamp TEXT NOT NULL,
                payment_method TEXT DEFAULT 'cash',
                person_id TEXT,
                loyalty_stamps INTEGER
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS persons (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                balance REAL DEFAULT 0
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS loyalty_cards (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                card_type_id TEXT NOT NULL,
                current_stamps INTEGER DEFAULT 0,
                completed_cards INTEGER DEFAULT 0,
                history TEXT,
                FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS loyalty_card_types (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                binding_type TEXT NOT NULL,
                product_id TEXT,
                product_ids TEXT,
                category_id TEXT,
                required_purchases INTEGER,
                pay_count INTEGER,
                get_count INTEGER,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                allow_upgrade INTEGER DEFAULT 0,
                created_at TEXT
            )
        ");

        // Migration: allow_upgrade Spalte hinzufügen falls nicht vorhanden
        try {
            $this->pdo->exec("ALTER TABLE loyalty_card_types ADD COLUMN allow_upgrade INTEGER DEFAULT 0");
        } catch (PDOException $e) {
            // Spalte existiert bereits - ignorieren
        }

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT NOT NULL,
                date TEXT NOT NULL,
                quantity INTEGER NOT NULL
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS debtors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                total_debt REAL DEFAULT 0,
                last_modified TEXT
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS debtor_entries (
                id TEXT PRIMARY KEY,
                debtor_id TEXT NOT NULL,
                date TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                paid INTEGER DEFAULT 0,
                timestamp TEXT,
                FOREIGN KEY (debtor_id) REFERENCES debtors(id) ON DELETE CASCADE
            )
        ");

        // Benutzer-Tabelle
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT,
                role TEXT DEFAULT 'staff',
                is_active INTEGER DEFAULT 1,
                created_at TEXT,
                last_login TEXT
            )
        ");

        // Aktivitäts-Log
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                username TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                timestamp TEXT NOT NULL
            )
        ");

        // App-Einstellungen
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ");

        // Vorbestellungen
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS preorders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                customer_class TEXT,
                items TEXT NOT NULL,
                total_price REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                pickup_time TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        ");

        // Produkte für Vorbestellung freigeben
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS preorder_products (
                product_id TEXT PRIMARY KEY,
                is_available INTEGER DEFAULT 1,
                max_quantity INTEGER DEFAULT 10
            )
        ");

        // Migration: color-Spalte zu categories hinzufügen falls nicht vorhanden
        $this->addColumnIfNotExists('categories', 'color', "TEXT DEFAULT '#3b82f6'");

        // Default-Kategorien einfügen wenn leer
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM categories");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            $defaults = [
                ['id' => 'drinks', 'label' => 'Getränke'],
                ['id' => 'snacks', 'label' => 'Snacks'],
                ['id' => 'other', 'label' => 'Sonstiges']
            ];
            $stmt = $this->pdo->prepare("INSERT INTO categories (id, label) VALUES (?, ?)");
            foreach ($defaults as $cat) {
                $stmt->execute([$cat['id'], $cat['label']]);
            }
        }

        // Default Admin-Benutzer erstellen wenn keine Benutzer existieren
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            $this->createUser([
                'username' => 'admin',
                'password' => 'admin',
                'display_name' => 'Administrator',
                'role' => 'admin'
            ]);
        }
    }

    // ============ PRODUCTS ============

    public function getProducts() {
        $stmt = $this->pdo->query("SELECT * FROM products ORDER BY sort_order, name");
        return $stmt->fetchAll();
    }

    public function saveProduct($product) {
        $stmt = $this->pdo->prepare("
            INSERT OR REPLACE INTO products (id, name, price, category, sort_order)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $product['id'],
            $product['name'],
            $product['price'],
            $product['category'] ?? null,
            $product['sortOrder'] ?? 0
        ]);
        return $product;
    }

    public function saveProducts($products) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM products");
            $stmt = $this->pdo->prepare("
                INSERT INTO products (id, name, price, category, sort_order)
                VALUES (?, ?, ?, ?, ?)
            ");
            foreach ($products as $product) {
                $stmt->execute([
                    $product['id'],
                    $product['name'],
                    $product['price'],
                    $product['category'] ?? null,
                    $product['sortOrder'] ?? 0
                ]);
            }
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function deleteProduct($id) {
        $stmt = $this->pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    // ============ CATEGORIES ============

    public function getCategories() {
        $stmt = $this->pdo->query("SELECT * FROM categories");
        return $stmt->fetchAll();
    }

    public function saveCategories($categories) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM categories");
            $stmt = $this->pdo->prepare("INSERT INTO categories (id, label, color) VALUES (?, ?, ?)");
            foreach ($categories as $cat) {
                $color = $cat['color'] ?? '#3b82f6';
                $stmt->execute([$cat['id'], $cat['label'], $color]);
            }
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    // ============ SALES ============

    public function getSales() {
        $stmt = $this->pdo->query("SELECT * FROM sales ORDER BY timestamp DESC");
        $sales = $stmt->fetchAll();
        // Konvertiere DB-Felder zu JS-Konvention
        return array_map(function($sale) {
            return [
                'id' => $sale['id'],
                'name' => $sale['name'],
                'price' => $sale['price'],
                'timestamp' => $sale['timestamp'],
                'paymentMethod' => $sale['payment_method'],
                'personId' => $sale['person_id'],
                'loyaltyStamps' => $sale['loyalty_stamps']
            ];
        }, $sales);
    }

    public function addSale($sale) {
        // Validierung: Prüfe ob erforderliche Felder vorhanden sind
        if (empty($sale) || !isset($sale['price']) || !isset($sale['timestamp'])) {
            throw new Exception('Ungültige Verkaufsdaten: price und timestamp erforderlich');
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO sales (name, price, timestamp, payment_method, person_id, loyalty_stamps)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        // Akzeptiere sowohl 'name' als auch 'productName'
        $name = $sale['name'] ?? $sale['productName'] ?? '';
        $stmt->execute([
            $name,
            $sale['price'],
            $sale['timestamp'],
            $sale['paymentMethod'] ?? 'cash',
            $sale['personId'] ?? null,
            $sale['loyaltyStamps'] ?? null
        ]);
        $sale['id'] = $this->pdo->lastInsertId();
        return $sale;
    }

    public function saveSales($sales) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM sales");

            // Wenn keine Verkäufe, einfach committen (alle gelöscht)
            if (empty($sales)) {
                $this->pdo->commit();
                return true;
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO sales (name, price, timestamp, payment_method, person_id, loyalty_stamps)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($sales as $sale) {
                // Überspringe ungültige Einträge
                if (!is_array($sale) || !isset($sale['price']) || !isset($sale['timestamp'])) {
                    continue;
                }
                // Akzeptiere sowohl 'name' als auch 'productName'
                $name = $sale['name'] ?? $sale['productName'] ?? '';
                $stmt->execute([
                    $name,
                    $sale['price'],
                    $sale['timestamp'],
                    $sale['paymentMethod'] ?? 'cash',
                    $sale['personId'] ?? null,
                    $sale['loyaltyStamps'] ?? null
                ]);
            }
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    // ============ PERSONS ============

    public function getPersons() {
        $stmt = $this->pdo->query("SELECT * FROM persons ORDER BY name");
        $persons = $stmt->fetchAll();

        // Lade Treuekarten für jede Person
        $cardStmt = $this->pdo->prepare("SELECT * FROM loyalty_cards WHERE person_id = ?");
        foreach ($persons as &$person) {
            $cardStmt->execute([$person['id']]);
            $cards = $cardStmt->fetchAll();
            $person['loyaltyCards'] = array_map(function($card) {
                return [
                    'id' => $card['id'],
                    'cardTypeId' => $card['card_type_id'],
                    'currentStamps' => $card['current_stamps'],
                    'completedCards' => $card['completed_cards'],
                    'history' => json_decode($card['history'] ?? '[]', true)
                ];
            }, $cards);
        }

        return $persons;
    }

    public function savePerson($person) {
        $stmt = $this->pdo->prepare("
            INSERT OR REPLACE INTO persons (id, name, balance)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([
            $person['id'],
            $person['name'],
            $person['balance'] ?? 0
        ]);

        // Lösche und speichere Treuekarten
        $this->pdo->prepare("DELETE FROM loyalty_cards WHERE person_id = ?")->execute([$person['id']]);

        if (!empty($person['loyaltyCards'])) {
            $cardStmt = $this->pdo->prepare("
                INSERT INTO loyalty_cards (id, person_id, card_type_id, current_stamps, completed_cards, history)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($person['loyaltyCards'] as $card) {
                $cardStmt->execute([
                    $card['id'],
                    $person['id'],
                    $card['cardTypeId'],
                    $card['currentStamps'] ?? 0,
                    $card['completedCards'] ?? 0,
                    json_encode($card['history'] ?? [])
                ]);
            }
        }

        return $person;
    }

    public function savePersons($persons) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM loyalty_cards");
            $this->pdo->exec("DELETE FROM persons");

            foreach ($persons as $person) {
                $this->savePerson($person);
            }

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function deletePerson($id) {
        $this->pdo->prepare("DELETE FROM loyalty_cards WHERE person_id = ?")->execute([$id]);
        $stmt = $this->pdo->prepare("DELETE FROM persons WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    // ============ LOYALTY CARD TYPES ============

    public function getLoyaltyCardTypes() {
        $stmt = $this->pdo->query("SELECT * FROM loyalty_card_types ORDER BY name");
        $types = $stmt->fetchAll();
        return array_map(function($type) {
            return [
                'id' => $type['id'],
                'name' => $type['name'],
                'type' => $type['type'],
                'bindingType' => $type['binding_type'],
                'productId' => $type['product_id'],
                'productIds' => json_decode($type['product_ids'] ?? 'null', true),
                'categoryId' => $type['category_id'],
                'requiredPurchases' => $type['required_purchases'],
                'payCount' => $type['pay_count'],
                'getCount' => $type['get_count'],
                'description' => $type['description'],
                'isActive' => (bool)$type['is_active'],
                'allowUpgrade' => (bool)($type['allow_upgrade'] ?? 0),
                'createdAt' => $type['created_at']
            ];
        }, $types);
    }

    public function saveLoyaltyCardType($type) {
        $stmt = $this->pdo->prepare("
            INSERT OR REPLACE INTO loyalty_card_types
            (id, name, type, binding_type, product_id, product_ids, category_id,
             required_purchases, pay_count, get_count, description, is_active, allow_upgrade, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $type['id'],
            $type['name'],
            $type['type'],
            $type['bindingType'],
            $type['productId'] ?? null,
            isset($type['productIds']) ? json_encode($type['productIds']) : null,
            $type['categoryId'] ?? null,
            $type['requiredPurchases'] ?? null,
            $type['payCount'] ?? null,
            $type['getCount'] ?? null,
            $type['description'] ?? null,
            isset($type['isActive']) ? ($type['isActive'] ? 1 : 0) : 1,
            isset($type['allowUpgrade']) ? ($type['allowUpgrade'] ? 1 : 0) : 0,
            $type['createdAt'] ?? date('c')
        ]);
        return $type;
    }

    public function saveLoyaltyCardTypes($types) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM loyalty_card_types");
            foreach ($types as $type) {
                $this->saveLoyaltyCardType($type);
            }
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function deleteLoyaltyCardType($id) {
        $stmt = $this->pdo->prepare("DELETE FROM loyalty_card_types WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    // ============ INVENTORY ============

    public function getInventory() {
        $stmt = $this->pdo->query("SELECT * FROM inventory ORDER BY date DESC, id DESC");
        $items = $stmt->fetchAll();
        return array_map(function($item) {
            return [
                'id' => $item['id'],
                'productId' => $item['product_id'],
                'date' => $item['date'],
                'quantity' => $item['quantity']
            ];
        }, $items);
    }

    public function saveInventory($inventory) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM inventory");
            $stmt = $this->pdo->prepare("
                INSERT INTO inventory (product_id, date, quantity)
                VALUES (?, ?, ?)
            ");
            foreach ($inventory as $item) {
                $stmt->execute([
                    $item['productId'],
                    $item['date'],
                    $item['quantity']
                ]);
            }
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function addInventoryEntry($entry) {
        $stmt = $this->pdo->prepare("
            INSERT INTO inventory (product_id, date, quantity)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([
            $entry['productId'],
            $entry['date'],
            $entry['quantity']
        ]);
        $entry['id'] = $this->pdo->lastInsertId();
        return $entry;
    }

    // ============ DEBTORS ============

    public function getDebtors() {
        $stmt = $this->pdo->query("SELECT * FROM debtors ORDER BY name");
        $debtors = $stmt->fetchAll();

        // Lade Einträge für jeden Schuldner
        $entryStmt = $this->pdo->prepare("SELECT * FROM debtor_entries WHERE debtor_id = ? ORDER BY timestamp DESC");
        foreach ($debtors as &$debtor) {
            $entryStmt->execute([$debtor['id']]);
            $entries = $entryStmt->fetchAll();
            $debtor['entries'] = array_map(function($entry) {
                return [
                    'id' => $entry['id'],
                    'date' => $entry['date'],
                    'amount' => $entry['amount'],
                    'description' => $entry['description'],
                    'paid' => (bool)$entry['paid'],
                    'timestamp' => $entry['timestamp']
                ];
            }, $entries);
            $debtor['totalDebt'] = $debtor['total_debt'];
            $debtor['lastModified'] = $debtor['last_modified'];
            unset($debtor['total_debt'], $debtor['last_modified']);
        }

        return $debtors;
    }

    public function saveDebtor($debtor) {
        $stmt = $this->pdo->prepare("
            INSERT OR REPLACE INTO debtors (id, name, total_debt, last_modified)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $debtor['id'],
            $debtor['name'],
            $debtor['totalDebt'] ?? 0,
            $debtor['lastModified'] ?? date('c')
        ]);

        // Lösche und speichere Einträge
        $this->pdo->prepare("DELETE FROM debtor_entries WHERE debtor_id = ?")->execute([$debtor['id']]);

        if (!empty($debtor['entries'])) {
            $entryStmt = $this->pdo->prepare("
                INSERT INTO debtor_entries (id, debtor_id, date, amount, description, paid, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($debtor['entries'] as $entry) {
                $entryStmt->execute([
                    $entry['id'],
                    $debtor['id'],
                    $entry['date'],
                    $entry['amount'],
                    $entry['description'] ?? '',
                    $entry['paid'] ? 1 : 0,
                    $entry['timestamp'] ?? date('c')
                ]);
            }
        }

        return $debtor;
    }

    public function saveDebtors($debtors) {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec("DELETE FROM debtor_entries");
            $this->pdo->exec("DELETE FROM debtors");

            foreach ($debtors as $debtor) {
                $this->saveDebtor($debtor);
            }

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function deleteDebtor($id) {
        $this->pdo->prepare("DELETE FROM debtor_entries WHERE debtor_id = ?")->execute([$id]);
        $stmt = $this->pdo->prepare("DELETE FROM debtors WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    // ============ USERS ============

    public function getUsers() {
        $stmt = $this->pdo->query("SELECT id, username, display_name, role, is_active, created_at, last_login FROM users ORDER BY username");
        return $stmt->fetchAll();
    }

    public function getUserById($id) {
        $stmt = $this->pdo->prepare("SELECT id, username, display_name, role, is_active, created_at, last_login FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function getUserByUsername($username) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetch();
    }

    public function createUser($userData) {
        $id = uniqid('user_', true);
        $stmt = $this->pdo->prepare("
            INSERT INTO users (id, username, password_hash, display_name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
        ");
        $stmt->execute([
            $id,
            $userData['username'],
            password_hash($userData['password'], PASSWORD_DEFAULT),
            $userData['display_name'] ?? $userData['username'],
            $userData['role'] ?? 'staff',
            date('c')
        ]);
        return $this->getUserById($id);
    }

    public function updateUser($id, $userData) {
        $updates = [];
        $params = [];

        if (isset($userData['display_name'])) {
            $updates[] = 'display_name = ?';
            $params[] = $userData['display_name'];
        }
        if (isset($userData['role'])) {
            $updates[] = 'role = ?';
            $params[] = $userData['role'];
        }
        if (isset($userData['is_active'])) {
            $updates[] = 'is_active = ?';
            $params[] = $userData['is_active'] ? 1 : 0;
        }
        if (isset($userData['password']) && !empty($userData['password'])) {
            $updates[] = 'password_hash = ?';
            $params[] = password_hash($userData['password'], PASSWORD_DEFAULT);
        }

        if (empty($updates)) return false;

        $params[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->getUserById($id);
    }

    public function deleteUser($id) {
        $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function verifyUserPassword($username, $password) {
        $user = $this->getUserByUsername($username);
        if (!$user) return false;
        if (!$user['is_active']) return false;
        if (!password_verify($password, $user['password_hash'])) return false;

        // Update last login
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = ? WHERE id = ?");
        $stmt->execute([date('c'), $user['id']]);

        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'display_name' => $user['display_name'],
            'role' => $user['role']
        ];
    }

    // ============ ACTIVITY LOG ============

    public function logActivity($userId, $username, $action, $details = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO activity_log (user_id, username, action, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $username,
            $action,
            $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            date('c')
        ]);
    }

    public function getActivityLog($limit = 100, $offset = 0, $userId = null) {
        $sql = "SELECT * FROM activity_log";
        $params = [];

        if ($userId) {
            $sql .= " WHERE user_id = ?";
            $params[] = $userId;
        }

        $sql .= " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        return array_map(function($log) {
            return [
                'id' => $log['id'],
                'userId' => $log['user_id'],
                'username' => $log['username'],
                'action' => $log['action'],
                'details' => $log['details'] ? json_decode($log['details'], true) : null,
                'ipAddress' => $log['ip_address'],
                'timestamp' => $log['timestamp']
            ];
        }, $logs);
    }

    // ============ SETTINGS ============

    public function getSetting($key, $default = null) {
        $stmt = $this->pdo->prepare("SELECT value FROM settings WHERE key = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? json_decode($row['value'], true) : $default;
    }

    public function setSetting($key, $value) {
        $stmt = $this->pdo->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        $stmt->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE)]);
    }

    public function getAllSettings() {
        $stmt = $this->pdo->query("SELECT * FROM settings");
        $rows = $stmt->fetchAll();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['key']] = json_decode($row['value'], true);
        }
        return $settings;
    }

    // ============ PREORDERS ============

    public function getPreorders($status = null) {
        $sql = "SELECT * FROM preorders";
        $params = [];

        if ($status) {
            $sql .= " WHERE status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        return array_map(function($order) {
            return [
                'id' => $order['id'],
                'customerName' => $order['customer_name'],
                'customerClass' => $order['customer_class'],
                'items' => json_decode($order['items'], true),
                'totalPrice' => $order['total_price'],
                'status' => $order['status'],
                'pickupTime' => $order['pickup_time'],
                'createdAt' => $order['created_at'],
                'completedAt' => $order['completed_at']
            ];
        }, $orders);
    }

    public function createPreorder($order) {
        $stmt = $this->pdo->prepare("
            INSERT INTO preorders (customer_name, customer_class, items, total_price, status, pickup_time, created_at)
            VALUES (?, ?, ?, ?, 'pending', ?, ?)
        ");
        $stmt->execute([
            $order['customerName'],
            $order['customerClass'] ?? null,
            json_encode($order['items'], JSON_UNESCAPED_UNICODE),
            $order['totalPrice'],
            $order['pickupTime'] ?? null,
            date('c')
        ]);
        $order['id'] = $this->pdo->lastInsertId();
        return $order;
    }

    public function updatePreorderStatus($id, $status) {
        $completedAt = ($status === 'completed' || $status === 'cancelled') ? date('c') : null;
        $stmt = $this->pdo->prepare("UPDATE preorders SET status = ?, completed_at = ? WHERE id = ?");
        $stmt->execute([$status, $completedAt, $id]);
        return $stmt->rowCount() > 0;
    }

    public function getPreorderProducts() {
        $stmt = $this->pdo->query("SELECT * FROM preorder_products");
        $rows = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $row) {
            $result[$row['product_id']] = [
                'isAvailable' => (bool)$row['is_available'],
                'maxQuantity' => $row['max_quantity']
            ];
        }
        return $result;
    }

    public function setPreorderProduct($productId, $isAvailable, $maxQuantity = 10) {
        $stmt = $this->pdo->prepare("
            INSERT OR REPLACE INTO preorder_products (product_id, is_available, max_quantity)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$productId, $isAvailable ? 1 : 0, $maxQuantity]);
    }
}
