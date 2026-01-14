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
                label TEXT NOT NULL
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
                created_at TEXT
            )
        ");

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
            $stmt = $this->pdo->prepare("INSERT INTO categories (id, label) VALUES (?, ?)");
            foreach ($categories as $cat) {
                $stmt->execute([$cat['id'], $cat['label']]);
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
        $stmt = $this->pdo->prepare("
            INSERT INTO sales (name, price, timestamp, payment_method, person_id, loyalty_stamps)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $sale['name'],
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
            $stmt = $this->pdo->prepare("
                INSERT INTO sales (name, price, timestamp, payment_method, person_id, loyalty_stamps)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($sales as $sale) {
                $stmt->execute([
                    $sale['name'],
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
                'createdAt' => $type['created_at']
            ];
        }, $types);
    }

    public function saveLoyaltyCardType($type) {
        $stmt = $this->pdo->prepare("
            INSERT OR REPLACE INTO loyalty_card_types
            (id, name, type, binding_type, product_id, product_ids, category_id,
             required_purchases, pay_count, get_count, description, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
}
