// ===========================
// STATE & STORAGE
// ===========================

let products = [];
let sales = [];
let persons = [];
let loyaltyCardTypes = [];
let categories = [];
let inventory = [];
let selectedPersonId = null;
let currentFilter = 'today';
let showZeroBalance = true;
let showZeroBalanceCredits = true;
let currentAlphabetFilter = 'all';
let debtors = [];
let selectedDebtorId = null;
let showPaidDebts = true;
let currentDebtAlphabetFilter = 'all';

const STORAGE_KEY = 'fos_bar_sales';
const PERSONS_STORAGE_KEY = 'fos_bar_persons';
const LOYALTY_CARD_TYPES_KEY = 'fos_bar_loyalty_card_types';
const CATEGORIES_KEY = 'fos_bar_categories';
const INVENTORY_KEY = 'fos_bar_inventory';
const DEBTORS_STORAGE_KEY = 'fos_bar_debtors';

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    loadCategories();
    await loadProducts();
    loadSales();
    await loadPersons();
    loadLoyaltyCardTypes();
    loadInventory();
    await loadDebtors();
    initEventListeners();
    updateCurrentDate();
    renderAll();
});

// ===========================
// DATA LOADING
// ===========================

async function loadProducts() {
    // Try to load from localStorage first (managed products)
    const storedProducts = localStorage.getItem('fos_bar_products');

    if (storedProducts) {
        try {
            products = JSON.parse(storedProducts);
            renderProducts();
            console.log('Produkte aus localStorage geladen');
            return;
        } catch (error) {
            console.error('Fehler beim Laden aus localStorage:', error);
        }
    }

    // Fallback: Load from products.json
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        products = data.products;
        renderProducts();
        console.log('Produkte aus products.json geladen');
    } catch (error) {
        console.error('Fehler beim Laden der Produkte:', error);
        showToast('Fehler beim Laden der Produkte');
    }
}

function loadSales() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            sales = JSON.parse(stored);
        } catch (error) {
            console.error('Fehler beim Laden der Verkäufe:', error);
            sales = [];
        }
    }
}

function saveSales() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

async function loadPersons() {
    // Try to load from localStorage first (managed persons)
    const stored = localStorage.getItem(PERSONS_STORAGE_KEY);

    if (stored) {
        try {
            persons = JSON.parse(stored);
            console.log('Personen aus localStorage geladen:', persons.length);
            return;
        } catch (error) {
            console.error('Fehler beim Laden aus localStorage:', error);
        }
    }

    // Fallback: Load from persons.json
    try {
        const response = await fetch('persons.json');
        const data = await response.json();
        persons = data.persons || [];
        console.log('Personen aus persons.json geladen:', persons.length);
    } catch (error) {
        console.error('Fehler beim Laden der Personen:', error);
        // If no file exists, start with empty array
        persons = [];
    }
}

function savePersons() {
    localStorage.setItem(PERSONS_STORAGE_KEY, JSON.stringify(persons));
    console.log('Personen gespeichert:', persons.length);
}

function loadLoyaltyCardTypes() {
    const stored = localStorage.getItem(LOYALTY_CARD_TYPES_KEY);
    if (stored) {
        try {
            loyaltyCardTypes = JSON.parse(stored);
            console.log('Treuekarten-Typen geladen:', loyaltyCardTypes.length);
        } catch (error) {
            console.error('Fehler beim Laden der Treuekarten-Typen:', error);
            loyaltyCardTypes = [];
        }
    }
}

function loadCategories() {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (stored) {
        try {
            categories = JSON.parse(stored);
            console.log('Kategorien geladen:', categories.length);
        } catch (error) {
            console.error('Fehler beim Laden der Kategorien:', error);
            categories = getDefaultCategories();
        }
    } else {
        categories = getDefaultCategories();
    }
}

function getDefaultCategories() {
    return [
        { id: 'drinks', label: 'Getränke' },
        { id: 'alcohol', label: 'Alkoholische Getränke' },
        { id: 'snacks', label: 'Snacks' }
    ];
}

function loadInventory() {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (stored) {
        try {
            inventory = JSON.parse(stored);
            console.log('Inventar geladen:', inventory.length);
        } catch (error) {
            console.error('Fehler beim Laden des Inventars:', error);
            inventory = [];
        }
    }
}

function saveInventory() {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

async function loadDebtors() {
    // Load index first
    const indexStr = localStorage.getItem(DEBTORS_STORAGE_KEY + '_index');

    if (indexStr) {
        try {
            const index = JSON.parse(indexStr);
            console.log('Lade', index.length, 'Schuldner aus separaten Dateien...');

            debtors = [];
            index.forEach(item => {
                const debtorStr = localStorage.getItem(DEBTORS_STORAGE_KEY + '_' + item.id);
                if (debtorStr) {
                    try {
                        debtors.push(JSON.parse(debtorStr));
                    } catch (error) {
                        console.error('Fehler beim Laden von Schuldner', item.id, ':', error);
                    }
                }
            });

            console.log('Schuldner aus localStorage geladen:', debtors.length);
        } catch (error) {
            console.error('Fehler beim Laden der Schuldner:', error);
            // Try old format as fallback
            await loadDebtorsLegacy();
        }
    } else {
        // Try old format as fallback
        await loadDebtorsLegacy();
    }
}

// Fallback function to load old format and migrate
async function loadDebtorsLegacy() {
    const stored = localStorage.getItem(DEBTORS_STORAGE_KEY);
    if (stored) {
        try {
            debtors = JSON.parse(stored);
            console.log('Schuldner aus altem Format geladen:', debtors.length);
            console.log('Migriere zu neuem Format...');
            saveDebtors(); // Save in new format
            // Remove old format
            localStorage.removeItem(DEBTORS_STORAGE_KEY);
            console.log('Migration abgeschlossen');
        } catch (error) {
            console.error('Fehler beim Laden der Schuldner (Legacy):', error);
            debtors = [];
        }
    }
}

function saveDebtors() {
    // Save index with all debtor IDs
    const debtorIndex = debtors.map(d => ({
        id: d.id,
        name: d.name,
        debt: d.debt,
        isPaid: d.isPaid,
        lastModified: new Date().toISOString()
    }));
    localStorage.setItem(DEBTORS_STORAGE_KEY + '_index', JSON.stringify(debtorIndex));

    // Save each debtor in separate localStorage entry
    debtors.forEach(debtor => {
        localStorage.setItem(
            DEBTORS_STORAGE_KEY + '_' + debtor.id,
            JSON.stringify(debtor)
        );
    });

    console.log('Schuldner gespeichert:', debtors.length, '(in separaten Dateien)');
}

// ===========================
// EVENT LISTENERS
// ===========================

function initEventListeners() {
    // Tab navigation
    console.log('🔧 Setting up tab navigation...');
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log('   Found', tabButtons.length, 'tab buttons');

    tabButtons.forEach(btn => {
        console.log('   - Setting up button for:', btn.dataset.tab);
        btn.addEventListener('click', () => {
            console.log('👆 Tab button clicked:', btn.dataset.tab);
            switchTab(btn.dataset.tab);
        });
    });

    console.log('   ✅ Tab navigation setup complete');

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Export/Import Sales
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', importData);
    document.getElementById('btn-clear-day').addEventListener('click', confirmClearDay);

    // Export/Import Persons
    document.getElementById('btn-export-persons').addEventListener('click', exportPersons);
    document.getElementById('btn-import-persons').addEventListener('click', () => {
        document.getElementById('file-import-persons').click();
    });
    document.getElementById('file-import-persons').addEventListener('change', importPersons);

    // Export/Import Debts
    document.getElementById('btn-export-debts').addEventListener('click', exportDebts);
    document.getElementById('btn-import-debts').addEventListener('click', () => {
        document.getElementById('file-import-debts').click();
    });
    document.getElementById('file-import-debts').addEventListener('change', importDebts);

    // Modal
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-confirm').addEventListener('click', executeModalAction);

    // Credits / Gutschriften
    document.getElementById('credits-form').addEventListener('submit', handleCreditsFormSubmit);
    document.getElementById('credit-modal-cancel').addEventListener('click', closeCreditModal);
    document.getElementById('show-zero-balance').addEventListener('change', (e) => {
        showZeroBalance = e.target.checked;
        renderPersonsList();
    });
    document.getElementById('show-zero-balance-credits').addEventListener('change', (e) => {
        showZeroBalanceCredits = e.target.checked;
        renderCreditsPersonsGrid();
    });

    // Inventory (nur in manager.html)
    const inventoryForm = document.getElementById('inventory-form');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', handleInventoryFormSubmit);
        populateInventoryProductSelector();
    }

    // Loyalty Card Assignment (nur in manager.html)
    const btnAddLoyaltyCard = document.getElementById('btn-add-loyalty-card');
    if (btnAddLoyaltyCard) {
        btnAddLoyaltyCard.addEventListener('click', showAddLoyaltyCardForm);
    }

    // Schuldbuch
    const debtorForm = document.getElementById('debtor-form');
    if (debtorForm) {
        debtorForm.addEventListener('submit', handleDebtorFormSubmit);
    }
    document.getElementById('debtor-modal-cancel').addEventListener('click', closeDebtorModal);
    document.getElementById('add-debt-amount-form').addEventListener('submit', handleAddDebtAmountFormSubmit);
    document.getElementById('add-debt-amount-modal-cancel').addEventListener('click', closeAddDebtAmountModal);
    document.getElementById('pay-debt-form').addEventListener('submit', handlePayDebtFormSubmit);
    document.getElementById('pay-debt-modal-cancel').addEventListener('click', closePayDebtModal);
    document.getElementById('show-paid-debts').addEventListener('change', (e) => {
        showPaidDebts = e.target.checked;
        renderDebtorsGrid();
    });
}

// ===========================
// PRODUCT RENDERING
// ===========================

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    // Group products by category
    const groupedProducts = {};
    products.forEach(product => {
        if (!groupedProducts[product.category]) {
            groupedProducts[product.category] = [];
        }
        groupedProducts[product.category].push(product);
    });

    // Sort products within each category by sortOrder (if available) and name
    Object.keys(groupedProducts).forEach(category => {
        groupedProducts[category].sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
        });
    });

    // Build category labels and order from loaded categories
    const categoryLabels = {};
    const categoryOrder = [];
    categories.forEach(cat => {
        categoryLabels[cat.id] = cat.label;
        categoryOrder.push(cat.id);
    });

    // Render products by category
    categoryOrder.forEach(category => {
        if (groupedProducts[category] && groupedProducts[category].length > 0) {
            // Add category header
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = categoryLabels[category] || category;
            grid.appendChild(header);

            // Add products in this category
            groupedProducts[category].forEach(product => {
                const btn = document.createElement('button');
                btn.className = `product-btn ${product.category}`;
                btn.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                `;
                btn.addEventListener('click', () => addSale(product));
                grid.appendChild(btn);
            });
        }
    });

    // Render any products with unknown categories
    Object.keys(groupedProducts).forEach(category => {
        if (!categoryOrder.includes(category)) {
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            grid.appendChild(header);

            groupedProducts[category].forEach(product => {
                const btn = document.createElement('button');
                btn.className = `product-btn ${product.category}`;
                btn.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                `;
                btn.addEventListener('click', () => addSale(product));
                grid.appendChild(btn);
            });
        }
    });
}

// ===========================
// SALES MANAGEMENT
// ===========================

function addSale(product) {
    const sale = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        price: product.price,
        timestamp: new Date().toISOString(),
        personId: selectedPersonId || null
    };

    // Charge person if selected
    if (selectedPersonId) {
        const person = persons.find(p => p.id === selectedPersonId);
        if (person) {
            chargePersonForSale(selectedPersonId, sale);
            showToast(`${product.name} verkauft an ${person.name} (Neues Guthaben: ${formatPrice(person.balance)})`);
        } else {
            showToast('Person nicht gefunden');
            return;
        }
    } else {
        showToast(`${product.name} verkauft`);
    }

    sales.push(sale);
    saveSales();
    renderAll();
}

function deleteSale(saleId) {
    confirmAction(
        'Verkauf löschen',
        'Möchten Sie diesen Verkauf wirklich löschen?',
        () => {
            sales = sales.filter(s => s.id !== saleId);
            saveSales();
            renderAll();
            showToast('Verkauf gelöscht');
        }
    );
}

function clearTodaySales() {
    const today = getTodayStart();
    sales = sales.filter(s => new Date(s.timestamp) < today);
    saveSales();
    renderAll();
    showToast('Heutige Verkäufe gelöscht');
}

// ===========================
// RENDERING
// ===========================

function renderAll() {
    renderSalesList();
    renderBilanz();
    renderStatistik();
    updateDailyTotal();
    renderPersonsList();
    renderCreditsPersonsGrid();
    renderCreditsProducts();
    renderInventoryTable();
    renderDebtorsGrid();
    renderDebtProducts();
}

function renderSalesList() {
    const container = document.getElementById('sales-list');
    const todaySales = getTodaySales();

    if (todaySales.length === 0) {
        container.innerHTML = '<p class="empty-message">Noch keine Verkäufe heute</p>';
        return;
    }

    container.innerHTML = todaySales
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(sale => {
            // Bestimme Zahlungsart und Badges
            let paymentBadge = '';
            let saleClass = '';

            if (sale.isFreeRedemption) {
                // Gratis-Bonus durch volle Treuekarte
                paymentBadge = '<span class="payment-badge badge-gratis">🎉 GRATIS (Treuekarte voll)</span>';
                saleClass = 'free-sale';
            } else if (sale.paidWithStamp || sale.paymentMethod === 'stamp') {
                // Bezahlt mit Stempel (kein Geld)
                paymentBadge = '<span class="payment-badge badge-stamp">✓ Stempel (0€)</span>';
                saleClass = 'stamp-sale';
            } else if (sale.personId) {
                // Bezahlt mit Guthaben
                paymentBadge = '<span class="payment-badge badge-credit">💳 Guthaben</span>';
                saleClass = 'credit-sale';
            } else {
                // Bar bezahlt
                paymentBadge = '<span class="payment-badge badge-cash">💵 Bar</span>';
                saleClass = 'cash-sale';
            }

            return `
                <div class="sale-item ${saleClass}">
                    <div class="sale-time">${formatTime(sale.timestamp)}</div>
                    <div class="sale-product">
                        ${sale.productName}
                        ${paymentBadge}
                    </div>
                    <div class="sale-price">${formatPrice(sale.price)}</div>
                    <button class="btn-delete" onclick="deleteSale('${sale.id}')">Löschen</button>
                </div>
            `;
        })
        .join('');
}

function renderBilanz() {
    // Check if Bilanz elements exist (nur in manager.html)
    const bilanzTotal = document.getElementById('bilanz-total');
    if (!bilanzTotal) {
        return; // Bilanz ist nicht auf dieser Seite
    }

    const todaySales = getTodaySales();

    // Summary
    const totalRevenue = todaySales.reduce((sum, s) => sum + s.price, 0);
    const totalCount = todaySales.length;

    bilanzTotal.textContent = formatPrice(totalRevenue);
    document.getElementById('bilanz-count').textContent = totalCount;

    // Breakdown by product
    const breakdown = {};
    todaySales.forEach(sale => {
        if (!breakdown[sale.productId]) {
            breakdown[sale.productId] = {
                name: sale.productName,
                quantity: 0,
                total: 0
            };
        }
        breakdown[sale.productId].quantity++;
        breakdown[sale.productId].total += sale.price;
    });

    const container = document.getElementById('product-breakdown');

    if (Object.keys(breakdown).length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Verkäufe heute</p>';
        return;
    }

    container.innerHTML = Object.values(breakdown)
        .sort((a, b) => b.total - a.total)
        .map(item => `
            <div class="breakdown-item">
                <span class="breakdown-name">${item.name}</span>
                <span class="breakdown-quantity">${item.quantity}x</span>
                <span class="breakdown-total">${formatPrice(item.total)}</span>
            </div>
        `)
        .join('');
}

function renderStatistik() {
    // Check if Statistik elements exist (nur in manager.html)
    const topSellers = document.getElementById('top-sellers');
    if (!topSellers) {
        return; // Statistik ist nicht auf dieser Seite
    }

    const filteredSales = getFilteredSales();

    // Calculate statistics
    const stats = {};
    filteredSales.forEach(sale => {
        if (!stats[sale.productId]) {
            stats[sale.productId] = {
                name: sale.productName,
                quantity: 0,
                revenue: 0
            };
        }
        stats[sale.productId].quantity++;
        stats[sale.productId].revenue += sale.price;
    });

    const sortedByQuantity = Object.values(stats).sort((a, b) => b.quantity - a.quantity);
    const sortedByRevenue = Object.values(stats).sort((a, b) => b.revenue - a.revenue);

    // Top sellers
    renderTopSellers(sortedByQuantity);

    // Quantity chart
    renderChart('quantity-chart', sortedByQuantity, 'quantity', 'Stück');

    // Revenue chart
    renderChart('revenue-chart', sortedByRevenue, 'revenue', '€');
}

function renderTopSellers(stats) {
    const container = document.getElementById('top-sellers');
    if (!container) return;

    if (stats.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Daten verfügbar</p>';
        return;
    }

    container.innerHTML = stats.slice(0, 5).map((item, index) => `
        <div class="rank-item">
            <div class="rank-number">${index + 1}</div>
            <div class="rank-name">${item.name}</div>
            <div class="rank-value">${item.quantity} Stück (${formatPrice(item.revenue)})</div>
        </div>
    `).join('');
}

function renderChart(containerId, data, metric, unit) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Daten verfügbar</p>';
        return;
    }

    const maxValue = Math.max(...data.map(d => d[metric]));

    container.innerHTML = data.map(item => {
        const percentage = maxValue > 0 ? (item[metric] / maxValue) * 100 : 0;
        const value = metric === 'revenue' ? formatPrice(item[metric]) : item[metric];

        return `
            <div class="chart-bar">
                <div class="chart-label">
                    <span>${item.name}</span>
                    <span>${value} ${metric === 'revenue' ? '' : unit}</span>
                </div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${percentage}%">
                        ${percentage > 20 ? value : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===========================
// FILTERING & DATE HELPERS
// ===========================

function getTodaySales() {
    const today = getTodayStart();
    return sales.filter(s => new Date(s.timestamp) >= today);
}

function getFilteredSales() {
    const now = new Date();

    switch (currentFilter) {
        case 'today':
            return getTodaySales();

        case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return sales.filter(s => new Date(s.timestamp) >= weekAgo);

        case 'all':
        default:
            return sales;
    }
}

function getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderStatistik();
}

// ===========================
// TAB NAVIGATION
// ===========================

function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            console.log('  ✓ Button activated:', tabName);
        }
    });

    // Update content
    let foundContent = false;
    document.querySelectorAll('.tab-content').forEach(content => {
        const isActive = content.id === tabName + '-tab';
        content.classList.toggle('active', isActive);
        if (isActive) {
            console.log('  ✓ Content shown:', content.id);
            foundContent = true;
        }
    });

    if (!foundContent) {
        console.warn('  ⚠️ No content found for tab:', tabName + '-tab');
    }

    // Note: bilanz and statistik are now in manager.html
    // Only verkauf, gutschriften, and schuldbuch are in index.html
}

// ===========================
// EXPORT / IMPORT
// ===========================

function exportData() {
    const dataStr = JSON.stringify(sales, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fos-bar-verkäufe-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast('Daten exportiert');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedSales = JSON.parse(e.target.result);

            confirmAction(
                'Daten importieren',
                `${importedSales.length} Verkäufe gefunden. Möchten Sie diese importieren? (Bestehende Daten werden überschrieben)`,
                () => {
                    sales = importedSales;
                    saveSales();
                    renderAll();
                    showToast('Daten importiert');
                }
            );
        } catch (error) {
            console.error('Fehler beim Importieren:', error);
            showToast('Fehler beim Importieren der Daten');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

function confirmClearDay() {
    const todayCount = getTodaySales().length;
    confirmAction(
        'Tag löschen',
        `Möchten Sie wirklich alle ${todayCount} Verkäufe von heute löschen?`,
        clearTodaySales
    );
}

function exportPersons() {
    const exportData = {
        persons: persons,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fos-bar-gutschriften-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast('Gutschriften exportiert');
}

function importPersons(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            const importedPersons = importedData.persons || importedData;

            if (!Array.isArray(importedPersons)) {
                showToast('Ungültiges Dateiformat');
                return;
            }

            confirmAction(
                'Gutschriften importieren',
                `${importedPersons.length} Personen gefunden. Möchten Sie diese importieren? (Bestehende Daten werden überschrieben)`,
                () => {
                    persons = importedPersons;
                    savePersons();
                    renderAll();
                    showToast('Gutschriften importiert');
                }
            );
        } catch (error) {
            console.error('Fehler beim Importieren:', error);
            showToast('Fehler beim Importieren der Gutschriften');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}


// Export single debtor to file
function exportSingleDebtor(debtorId) {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) {
        showToast('Schuldner nicht gefunden');
        return;
    }

    const exportData = {
        debtor: debtor,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    // Sanitize filename
    const safeName = debtor.name.replace(/[^a-z0-9äöüß]/gi, '_');
    link.download = 'schuldbuch-' + safeName + '-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();

    URL.revokeObjectURL(url);
    showToast('Schuldner "' + debtor.name + '" exportiert');
}

// Import single debtor from file
function importSingleDebtor(fileData) {
    try {
        const importedData = JSON.parse(fileData);
        const importedDebtor = importedData.debtor || importedData;

        if (!importedDebtor.id || !importedDebtor.name) {
            showToast('Ungültiges Dateiformat');
            return false;
        }

        // Check if debtor already exists
        const existingIndex = debtors.findIndex(d => d.id === importedDebtor.id);

        const action = existingIndex >= 0 ? 'aktualisiert' : 'hinzugefügt';

        if (existingIndex >= 0) {
            debtors[existingIndex] = importedDebtor;
        } else {
            debtors.push(importedDebtor);
        }

        saveDebtors();
        renderDebtors();
        showToast('Schuldner "' + importedDebtor.name + '" ' + action);
        return true;
    } catch (error) {
        console.error('Fehler beim Importieren:', error);
        showToast('Fehler beim Importieren');
        return false;
    }
}

function exportDebts() {
    const exportData = {
        debtors: debtors,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fos-bar-schuldbuch-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();

    URL.revokeObjectURL(url);
    showToast('Schuldbuch exportiert');
}

function importDebts(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            const importedDebtors = importedData.debtors || importedData;

            if (!Array.isArray(importedDebtors)) {
                showToast('Ungültiges Dateiformat');
                return;
            }

            confirmAction(
                'Schuldbuch importieren',
                importedDebtors.length + ' Schuldner gefunden. Möchten Sie diese importieren? (Bestehende Daten werden überschrieben)',
                () => {
                    debtors = importedDebtors;
                    saveDebtors();
                    renderDebtors();
                    showToast('Schuldbuch erfolgreich importiert');
                }
            );
        } catch (error) {
            console.error('Fehler beim Importieren:', error);
            showToast('Fehler beim Importieren der Daten');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// ===========================
// UI HELPERS
// ===========================

function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('de-DE', options);
}

function updateDailyTotal() {
    const todaySales = getTodaySales();
    const total = todaySales.reduce((sum, s) => sum + s.price, 0);
    document.getElementById('daily-total').textContent = formatPrice(total);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// MODAL / CONFIRMATION
// ===========================

let modalCallback = null;

function confirmAction(title, message, callback) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('confirm-modal').classList.add('show');
    modalCallback = callback;
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('show');
    modalCallback = null;
}

function executeModalAction() {
    if (modalCallback) {
        modalCallback();
        modalCallback = null;
    }
    closeModal();
}

// ===========================
// CREDITS / GUTSCHRIFTEN MANAGEMENT
// ===========================

function handleCreditsFormSubmit(e) {
    e.preventDefault();
    console.log('handleCreditsFormSubmit aufgerufen');

    const formData = new FormData(e.target);
    const name = formData.get('person-name').trim();
    const amount = parseFloat(formData.get('credit-amount'));

    console.log('Name:', name, 'Amount:', amount);

    if (!name) {
        showToast('Bitte Namen eingeben');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast('Bitte gültigen Betrag eingeben');
        return;
    }

    console.log('Rufe addCredit auf...');
    addCredit(name, amount);
    closeCreditModal();
}

function addCredit(name, amount) {
    console.log('addCredit aufgerufen mit:', name, amount);
    console.log('Aktuelle persons array:', persons);

    let person = persons.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (person) {
        console.log('Person gefunden, aktualisiere Guthaben');
        person.balance += amount;
        person.transactions.push({
            id: generateId(),
            type: 'credit',
            amount: amount,
            timestamp: new Date().toISOString(),
            note: 'Guthaben aufgeladen'
        });
    } else {
        console.log('Neue Person wird erstellt');
        person = {
            id: generateId(),
            name: name,
            balance: amount,
            transactions: [{
                id: generateId(),
                type: 'credit',
                amount: amount,
                timestamp: new Date().toISOString(),
                note: 'Erstmaliges Aufladen'
            }],
            createdAt: new Date().toISOString()
        };
        persons.push(person);
        console.log('Person hinzugefügt, neue persons array:', persons);
    }

    console.log('Rufe savePersons auf...');
    savePersons();
    console.log('Rufe renderAll auf...');
    renderAll();
    showToast(`${formatPrice(amount)} für ${name} aufgeladen`);
}

function chargePersonForSale(personId, sale) {
    const person = persons.find(p => p.id === personId);
    if (!person) return false;

    person.balance -= sale.price;
    person.transactions.push({
        id: generateId(),
        type: 'purchase',
        amount: -sale.price,
        productName: sale.productName,
        timestamp: sale.timestamp,
        saleId: sale.id
    });

    savePersons();
    return true;
}

function refundPersonForSale(personId, sale) {
    const person = persons.find(p => p.id === personId);
    if (!person) return;

    person.balance += sale.price;
    person.transactions.push({
        id: generateId(),
        type: 'refund',
        amount: sale.price,
        productName: sale.productName,
        timestamp: new Date().toISOString(),
        saleId: sale.id
    });

    savePersons();
}

function renderPersonsList() {
    const container = document.getElementById('persons-list');
    const datalist = document.getElementById('person-suggestions');

    // Update datalist for autocomplete
    datalist.innerHTML = persons.map(p => `<option value="${p.name}">`).join('');

    // Filter persons
    let filteredPersons = showZeroBalance
        ? persons
        : persons.filter(p => p.balance !== 0);

    // Sort by balance (descending)
    filteredPersons = filteredPersons.sort((a, b) => b.balance - a.balance);

    // Update count
    document.getElementById('persons-count').textContent = persons.length;

    if (filteredPersons.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Personen gefunden</p>';
        return;
    }

    container.innerHTML = filteredPersons.map(person => {
        const balanceClass = person.balance > 0 ? 'positive' : person.balance < 0 ? 'negative' : 'zero';
        const cardClass = person.balance > 0 ? 'positive-balance' : person.balance < 0 ? 'negative-balance' : '';

        return `
            <div class="person-card ${cardClass}">
                <div class="person-info">
                    <div class="person-name">${escapeHtml(person.name)}</div>
                    <div class="person-balance ${balanceClass}">${formatPrice(person.balance)}</div>
                </div>
                <div class="person-actions">
                    <button class="btn-small btn-add-credit" onclick="quickAddCredit('${person.id}')">
                        + Aufladen
                    </button>
                    <button class="btn-small btn-delete-person" onclick="deletePerson('${person.id}')">
                        Löschen
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPersonSelector() {
    const select = document.getElementById('selected-person');
    const currentValue = select.value;

    select.innerHTML = '<option value="">Keine Person ausgewählt (Bar-Verkauf)</option>' +
        persons
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(person => `
                <option value="${person.id}">${person.name} (${formatPrice(person.balance)})</option>
            `).join('');

    // Restore selection if still valid
    if (currentValue && persons.find(p => p.id === currentValue)) {
        select.value = currentValue;
    }
}

function handlePersonSelection(e) {
    selectedPersonId = e.target.value || null;

    const infoDiv = document.getElementById('selected-person-info');

    if (selectedPersonId) {
        const person = persons.find(p => p.id === selectedPersonId);
        if (person) {
            document.getElementById('info-person-name').textContent = person.name;
            document.getElementById('info-person-balance').textContent = formatPrice(person.balance);
            infoDiv.style.display = 'block';
            showToast(`Person ausgewählt: ${person.name}`);
        }
    } else {
        infoDiv.style.display = 'none';
    }
}

function clearPersonSelection() {
    selectedPersonId = null;
    document.getElementById('selected-person').value = '';
    document.getElementById('selected-person-info').style.display = 'none';
    showToast('Personenauswahl aufgehoben');
}

function quickAddCredit(personId) {
    const person = persons.find(p => p.id === personId);
    if (!person) return;

    const amount = prompt(`Betrag für ${person.name} (€):`, '10.00');
    if (amount === null) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        showToast('Ungültiger Betrag');
        return;
    }

    addCredit(person.name, parsedAmount);
}

function deletePerson(personId) {
    const person = persons.find(p => p.id === personId);
    if (!person) return;

    confirmAction(
        'Person löschen',
        `Möchten Sie "${person.name}" (${formatPrice(person.balance)}) wirklich löschen?`,
        () => {
            persons = persons.filter(p => p.id !== personId);
            savePersons();

            // Clear selection if deleted person was selected
            if (selectedPersonId === personId) {
                clearPersonSelection();
            }

            renderAll();
            showToast('Person gelöscht');
        }
    );
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Hilfsfunktion: Nachname extrahieren
function getLastName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1]; // Letztes Wort ist der Nachname
}

// Alphabet-Filter initialisieren
function initAlphabetFilter() {
    const filterContainer = document.getElementById('alphabet-filter');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // "Alle" Button ist bereits im HTML
    alphabet.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'alphabet-btn';
        btn.dataset.letter = letter;
        btn.textContent = letter;
        btn.addEventListener('click', () => setAlphabetFilter(letter));
        filterContainer.appendChild(btn);
    });

    // Event Listener für "Alle" Button
    filterContainer.querySelector('[data-letter="all"]').addEventListener('click', () => setAlphabetFilter('all'));
}

function setAlphabetFilter(letter) {
    currentAlphabetFilter = letter;

    // Update active state
    document.querySelectorAll('.alphabet-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.letter === letter);
    });

    renderCreditsPersonsGrid();
}

function renderCreditsPersonsGrid() {
    const container = document.getElementById('persons-grid-credits');

    // Filter persons
    let filteredPersons = showZeroBalanceCredits
        ? persons
        : persons.filter(p => p.balance !== 0);

    // Filter by alphabet
    if (currentAlphabetFilter !== 'all') {
        filteredPersons = filteredPersons.filter(p => {
            const lastName = getLastName(p.name);
            return lastName.toUpperCase().startsWith(currentAlphabetFilter);
        });
    }

    // Sort by last name
    filteredPersons = filteredPersons.sort((a, b) => {
        const lastNameA = getLastName(a.name);
        const lastNameB = getLastName(b.name);
        return lastNameA.localeCompare(lastNameB, 'de');
    });

    // Update count
    document.getElementById('persons-count-credits').textContent = persons.length;

    if (filteredPersons.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Personen gefunden</p>';
        return;
    }

    container.innerHTML = filteredPersons.map(person => {
        const balanceClass = person.balance > 0 ? 'positive' : person.balance < 0 ? 'negative' : 'zero';
        const cardClass = person.balance > 0 ? 'positive-balance' : person.balance < 0 ? 'negative-balance' : '';
        const isSelected = selectedPersonId === person.id;

        return `
            <div class="person-card-credits ${cardClass} ${isSelected ? 'selected' : ''}" onclick="selectCreditsPersonById('${person.id}')">
                <div class="person-info">
                    <div class="person-name">${escapeHtml(person.name)}</div>
                    <div class="person-balance ${balanceClass}">${formatPrice(person.balance)}</div>
                </div>
            </div>
        `;
    }).join('');

    // Initialize alphabet filter if not done yet
    if (!document.querySelector('.alphabet-btn[data-letter="A"]')) {
        initAlphabetFilter();
    }
}

function selectCreditsPersonById(personId) {
    selectedPersonId = personId;
    const person = persons.find(p => p.id === personId);

    if (person) {
        document.getElementById('credits-info-person-name').textContent = person.name;
        document.getElementById('credits-info-person-balance').textContent = formatPrice(person.balance);
        document.getElementById('credits-selected-person-info').style.display = 'block';
        document.getElementById('credits-products-section').style.display = 'block';

        renderCreditsProducts();
        renderPersonLoyaltyCards(personId);
        renderCreditsPersonsGrid(); // Re-render to update selected state

        // Scroll to selected person info
        document.getElementById('credits-selected-person-info').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function clearCreditsPersonSelection() {
    selectedPersonId = null;
    document.getElementById('credits-selected-person-info').style.display = 'none';
    document.getElementById('credits-products-section').style.display = 'none';
    document.getElementById('loyalty-cards-section').style.display = 'none';
    renderCreditsPersonsGrid(); // Re-render to update selected state
}

function renderCreditsProducts() {
    const grid = document.getElementById('credits-products-grid');
    const personId = selectedPersonId;

    if (!personId || products.length === 0) {
        return;
    }

    grid.innerHTML = '';

    // Group products by category
    const groupedProducts = {};
    products.forEach(product => {
        if (!groupedProducts[product.category]) {
            groupedProducts[product.category] = [];
        }
        groupedProducts[product.category].push(product);
    });

    // Sort products within each category
    Object.keys(groupedProducts).forEach(category => {
        groupedProducts[category].sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
        });
    });

    // Build category labels and order from loaded categories
    const categoryLabels = {};
    const categoryOrder = [];
    categories.forEach(cat => {
        categoryLabels[cat.id] = cat.label;
        categoryOrder.push(cat.id);
    });

    // Render products by category
    categoryOrder.forEach(category => {
        if (groupedProducts[category] && groupedProducts[category].length > 0) {
            // Add category header
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = categoryLabels[category] || category;
            grid.appendChild(header);

            // Add products
            groupedProducts[category].forEach(product => {
                const btn = document.createElement('button');
                btn.className = `product-btn ${product.category}`;
                btn.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                `;
                btn.addEventListener('click', () => handleCreditsPurchase(personId, product));
                grid.appendChild(btn);
            });
        }
    });

    // Render any products with unknown categories
    Object.keys(groupedProducts).forEach(category => {
        if (!categoryOrder.includes(category)) {
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            grid.appendChild(header);

            groupedProducts[category].forEach(product => {
                const btn = document.createElement('button');
                btn.className = `product-btn ${product.category}`;
                btn.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                `;
                btn.addEventListener('click', () => handleCreditsPurchase(personId, product));
                grid.appendChild(btn);
            });
        }
    });
}

function handleCreditsPurchase(personId, product) {
    const person = persons.find(p => p.id === personId);
    if (!person) {
        showToast('Person nicht gefunden');
        return;
    }

    // Check payment method
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    // Create sale
    const sale = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        price: product.price,
        timestamp: new Date().toISOString(),
        personId: personId,
        isFreeRedemption: false
    };

    if (paymentMethod === 'stamp') {
        // Mit Stempelkarte bezahlen - KEIN Geld, nur Stempel

        // Prüfe ob Person eine passende Stempelkarte hat
        ensureLoyaltyCardsArray(person);
        const hasMatchingCard = person.loyaltyCards.some(card => {
            const cardType = loyaltyCardTypes.find(ct => ct.id === card.cardTypeId);
            return cardType && cardType.isActive && isProductEligibleForCard(product, cardType);
        });

        if (!hasMatchingCard) {
            showToast(`Keine passende Treuekarte für ${product.name}! Bitte erst Treuekarte hinzufügen.`);
            return;
        }

        const freeProduct = processLoyaltyForPurchase(person, product, sale);

        // Setze Preis auf 0, da mit Stempelkarte bezahlt wird
        sale.price = 0;
        sale.paidWithStamp = true;
        sale.originalPrice = product.price;

        if (freeProduct) {
            // Karte war voll - BONUS GRATIS!
            sale.isFreeRedemption = true;
            sale.loyaltyCardTypeId = freeProduct.cardType.id;

            showToast(`🎉 GRATIS BONUS! ${product.name} - Treuekarte "${freeProduct.cardType.name}" voll!`);
        } else {
            // Stempel wurde vergeben, kein Geld abgebucht
            showToast(`✓ Stempel vergeben für ${product.name}! (Kein Geld abgebucht)`);
        }
    } else {
        // Mit Guthaben bezahlen (KEIN Stempel)
        if (person.balance < product.price) {
            showToast(`Nicht genug Guthaben! ${person.name} hat nur ${formatPrice(person.balance)}`);
            return;
        }

        chargePersonForSale(personId, sale);
        showToast(`${product.name} verkauft an ${person.name} - Neues Guthaben: ${formatPrice(person.balance)}`);
    }

    // Add to sales
    sales.push(sale);
    saveSales();

    // Update UI
    renderAll();

    // Sofort Treuekarten aktualisieren, wenn mit Stempel bezahlt wurde
    if (paymentMethod === 'stamp') {
        renderPersonLoyaltyCards(personId);
    }
}

function showAddCreditDialog() {
    console.log('showAddCreditDialog called');
    document.getElementById('credit-modal').classList.add('show');
}

function closeCreditModal() {
    document.getElementById('credit-modal').classList.remove('show');
    document.getElementById('credits-form').reset();
}

// ===========================
// LOYALTY CARDS LOGIC
// ===========================

function ensureLoyaltyCardsArray(person) {
    if (!person.loyaltyCards) {
        person.loyaltyCards = [];
    }
}

function addLoyaltyCardToPerson(personId, cardTypeId) {
    const person = persons.find(p => p.id === personId);
    if (!person) {
        showToast('Person nicht gefunden');
        return false;
    }

    ensureLoyaltyCardsArray(person);

    // Prüfen ob Person diese Karte bereits hat
    const hasCard = person.loyaltyCards.some(lc => lc.cardTypeId === cardTypeId);
    if (hasCard) {
        showToast('Person hat diese Treuekarte bereits');
        return false;
    }

    const cardType = loyaltyCardTypes.find(ct => ct.id === cardTypeId);
    if (!cardType) {
        showToast('Treuekarte nicht gefunden');
        return false;
    }

    person.loyaltyCards.push({
        id: generateId(),
        cardTypeId: cardTypeId,
        currentStamps: 0,
        completedCards: 0,
        history: [],
        createdAt: new Date().toISOString()
    });

    savePersons();
    showToast(`Treuekarte "${cardType.name}" zu ${person.name} hinzugefügt`);
    return true;
}

function removeLoyaltyCardFromPerson(personId, cardId) {
    const person = persons.find(p => p.id === personId);
    if (!person) return false;

    ensureLoyaltyCardsArray(person);

    const cardIndex = person.loyaltyCards.findIndex(lc => lc.id === cardId);
    if (cardIndex === -1) {
        showToast('Karte nicht gefunden');
        return false;
    }

    person.loyaltyCards.splice(cardIndex, 1);
    savePersons();
    showToast('Treuekarte entfernt');
    return true;
}

function processLoyaltyForPurchase(person, product, sale) {
    ensureLoyaltyCardsArray(person);

    let freeProduct = null;
    const cardsToRemove = []; // Karten, die nach Einlösung gelöscht werden sollen

    // Alle passenden Treuekarten durchgehen
    person.loyaltyCards.forEach(card => {
        const cardType = loyaltyCardTypes.find(ct => ct.id === card.cardTypeId);
        if (!cardType || !cardType.isActive) return;

        // Prüfen ob Produkt zur Karte passt
        if (!isProductEligibleForCard(product, cardType)) return;

        const requiredStamps = cardType.type === 'buy_n_get_1'
            ? cardType.requiredPurchases
            : cardType.payCount;

        // ERST prüfen ob Karte bereits voll ist (Bonus einlösen)
        if (card.currentStamps >= requiredStamps) {
            // Karte ist voll - BONUS einlösen und Karte zur Löschung markieren!
            card.history.push({
                timestamp: new Date().toISOString(),
                action: 'redeem',
                productId: product.id,
                productName: product.name
            });

            freeProduct = {
                cardType: cardType,
                product: product
            };

            // Karte zur Löschung markieren
            cardsToRemove.push(card.id);

            // KEIN neuer Stempel nach Bonus-Einlösung!
        } else {
            // Karte noch nicht voll - normaler Stempel
            card.currentStamps++;
            card.history.push({
                timestamp: new Date().toISOString(),
                action: 'stamp',
                productId: product.id,
                productName: product.name,
                saleId: sale.id
            });
        }
    });

    // Vollständig eingelöste Karten entfernen
    if (cardsToRemove.length > 0) {
        person.loyaltyCards = person.loyaltyCards.filter(card => !cardsToRemove.includes(card.id));
    }

    savePersons();
    return freeProduct;
}

function isProductEligibleForCard(product, cardType) {
    if (cardType.bindingType === 'product') {
        return product.id === cardType.productId;
    } else if (cardType.bindingType === 'products') {
        return cardType.productIds && cardType.productIds.includes(product.id);
    } else if (cardType.bindingType === 'category') {
        return product.category === cardType.categoryId;
    }
    return false;
}

function renderPersonLoyaltyCards(personId, highlightCardId = null) {
    const container = document.getElementById('person-loyalty-cards');
    const section = document.getElementById('loyalty-cards-section');
    const person = persons.find(p => p.id === personId);

    // Immer Section anzeigen, auch wenn keine Karten vorhanden
    section.style.display = 'block';

    // Populate card type selector
    populateLoyaltyCardTypeSelector(personId);

    if (!person || !person.loyaltyCards || person.loyaltyCards.length === 0) {
        container.innerHTML = '<p class="empty-message">Noch keine Treuekarten zugewiesen. Klicken Sie auf "+ Treuekarte hinzufügen".</p>';
        return;
    }

    // Nur aktive Kartentypen anzeigen
    const activeCards = person.loyaltyCards.filter(card => {
        const cardType = loyaltyCardTypes.find(ct => ct.id === card.cardTypeId);
        return cardType && cardType.isActive;
    });

    if (activeCards.length === 0) {
        container.innerHTML = '<p class="empty-message">Noch keine Treuekarten zugewiesen. Klicken Sie auf "+ Treuekarte hinzufügen".</p>';
        return;
    }

    container.innerHTML = activeCards.map(card => {
        const cardType = loyaltyCardTypes.find(ct => ct.id === card.cardTypeId);
        const requiredStamps = cardType.type === 'buy_n_get_1'
            ? cardType.requiredPurchases
            : cardType.payCount;

        // Stempel-Visualisierung erstellen
        let stampsHtml = '';
        for (let i = 0; i < requiredStamps; i++) {
            const isFilled = i < card.currentStamps;
            stampsHtml += `<div class="stamp ${isFilled ? 'filled' : ''}">${isFilled ? '✓' : (i + 1)}</div>`;
        }
        // Gratis-Stempel hinzufügen
        const freeLabel = cardType.type === 'buy_n_get_1' ? 'GRATIS' : `+${cardType.getCount - cardType.payCount}`;
        stampsHtml += `<div class="stamp free">${freeLabel}</div>`;

        const bindingLabel = cardType.bindingType === 'product'
            ? products.find(p => p.id === cardType.productId)?.name || cardType.productId
            : getCategoryLabel(cardType.categoryId);

        const isHighlighted = highlightCardId === card.id;

        return `
            <div class="loyalty-card-display ${isHighlighted ? 'card-highlight' : ''}">
                <div class="loyalty-card-header">
                    <div>
                        <div class="loyalty-card-title">${escapeHtml(cardType.name)}</div>
                        <div class="loyalty-card-type">${bindingLabel}</div>
                    </div>
                    <button class="btn-remove-card" onclick="removePersonLoyaltyCard('${personId}', '${card.id}')" title="Karte entfernen">×</button>
                </div>
                <div class="stamps-container">
                    ${stampsHtml}
                </div>
                <div class="loyalty-card-progress">
                    <strong>${card.currentStamps}</strong> von ${requiredStamps} Stempeln
                </div>
                ${card.completedCards > 0 ? `
                    <div class="completed-count">
                        Bereits ${card.completedCards}x eingelöst
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Highlight-Animation nach kurzer Zeit entfernen
    if (highlightCardId) {
        setTimeout(() => {
            const highlightedCard = container.querySelector('.card-highlight');
            if (highlightedCard) {
                highlightedCard.classList.remove('card-highlight');
            }
        }, 1500);
    }
}

function populateLoyaltyCardTypeSelector(personId) {
    const select = document.getElementById('select-loyalty-card-type');
    const person = persons.find(p => p.id === personId);

    // Nur aktive Kartentypen, die die Person noch nicht hat
    const availableCardTypes = loyaltyCardTypes.filter(ct => {
        if (!ct.isActive) return false;
        if (!person || !person.loyaltyCards) return true;
        return !person.loyaltyCards.some(lc => lc.cardTypeId === ct.id);
    });

    select.innerHTML = '<option value="">Treuekarte auswählen...</option>' +
        availableCardTypes.map(ct => `<option value="${ct.id}">${escapeHtml(ct.name)}</option>`).join('');
}

function showAddLoyaltyCardForm() {
    const form = document.getElementById('add-loyalty-card-form');
    const button = document.getElementById('btn-add-loyalty-card');

    form.style.display = 'flex';
    button.style.display = 'none';
}

function cancelAddLoyaltyCard() {
    const form = document.getElementById('add-loyalty-card-form');
    const button = document.getElementById('btn-add-loyalty-card');
    const select = document.getElementById('select-loyalty-card-type');

    form.style.display = 'none';
    button.style.display = 'inline-block';
    select.value = '';
}

function confirmAddLoyaltyCard() {
    const personId = selectedPersonId; // Verwende die globale Variable statt Select-Element
    const cardTypeId = document.getElementById('select-loyalty-card-type').value;

    if (!personId) {
        showToast('Keine Person ausgewählt');
        return;
    }

    if (!cardTypeId) {
        showToast('Bitte Treuekarte auswählen');
        return;
    }

    if (addLoyaltyCardToPerson(personId, cardTypeId)) {
        cancelAddLoyaltyCard();
        renderPersonLoyaltyCards(personId);
    }
}

function removePersonLoyaltyCard(personId, cardId) {
    if (removeLoyaltyCardFromPerson(personId, cardId)) {
        renderPersonLoyaltyCards(personId);
    }
}

function getCategoryLabel(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.label : categoryId;
}

// ===========================
// INVENTORY MANAGEMENT
// ===========================

function addInventoryEntry(productId, quantity, type, note = '') {
    const entry = {
        id: generateId(),
        productId: productId,
        quantity: parseInt(quantity),
        type: type, // 'initial' | 'restock'
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        timestamp: new Date().toISOString(),
        note: note
    };

    inventory.push(entry);
    saveInventory();
    return entry;
}

function getTodayInventoryByProduct() {
    const today = new Date().toISOString().split('T')[0];
    const result = {};

    // Gruppiere Inventar nach Produkt
    inventory.filter(entry => entry.date === today).forEach(entry => {
        if (!result[entry.productId]) {
            result[entry.productId] = {
                productId: entry.productId,
                totalReceived: 0,
                entries: []
            };
        }
        result[entry.productId].totalReceived += entry.quantity;
        result[entry.productId].entries.push(entry);
    });

    return result;
}

function getTodaySalesByProduct() {
    const todaySales = getTodaySales();
    const result = {};

    todaySales.forEach(sale => {
        if (!result[sale.productId]) {
            result[sale.productId] = 0;
        }
        result[sale.productId]++;
    });

    return result;
}

function getInventoryOverview() {
    const inventoryByProduct = getTodayInventoryByProduct();
    const salesByProduct = getTodaySalesByProduct();
    const overview = [];

    // Für alle Produkte
    products.forEach(product => {
        const received = inventoryByProduct[product.id]?.totalReceived || 0;
        const sold = salesByProduct[product.id] || 0;
        const remaining = received - sold;

        overview.push({
            product: product,
            received: received,
            sold: sold,
            remaining: remaining
        });
    });

    return overview;
}

function calculateAverageConsumption(productId, days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = cutoffDate.getTime();

    const salesInPeriod = sales.filter(sale => {
        return sale.productId === productId && new Date(sale.timestamp).getTime() >= cutoffTimestamp;
    });

    return salesInPeriod.length / days;
}

function predictStockDuration(productId, currentStock) {
    if (currentStock <= 0) return 0;

    const avg7Days = calculateAverageConsumption(productId, 7);
    const avg30Days = calculateAverageConsumption(productId, 30);

    // Gewichteter Durchschnitt: 70% letzte 7 Tage, 30% letzte 30 Tage
    const avgConsumption = (avg7Days * 0.7) + (avg30Days * 0.3);

    if (avgConsumption === 0) return Infinity;

    return currentStock / avgConsumption;
}

function handleInventoryFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const productId = formData.get('productId');
    const quantity = formData.get('quantity');
    const type = formData.get('type');
    const note = formData.get('note');

    if (!productId || !quantity || quantity < 1) {
        showToast('Bitte alle Pflichtfelder ausfüllen');
        return;
    }

    addInventoryEntry(productId, quantity, type, note);

    const product = products.find(p => p.id === productId);
    showToast(`${quantity}x ${product.name} erfasst`);

    e.target.reset();
    renderInventoryTable();
}

function populateInventoryProductSelector() {
    const select = document.getElementById('inventory-product');
    if (!select) {
        return; // Inventar ist nicht auf dieser Seite
    }
    select.innerHTML = products
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join('');
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) {
        return; // Inventar ist nicht auf dieser Seite
    }
    const overview = getInventoryOverview();

    if (overview.every(item => item.received === 0 && item.sold === 0)) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Noch keine Daten für heute</td></tr>';
        return;
    }

    tbody.innerHTML = overview.map(item => {
        const avg7Days = calculateAverageConsumption(item.product.id, 7);
        const prognose = item.remaining > 0 ? predictStockDuration(item.product.id, item.remaining) : 0;

        let prognoseText = '';
        let prognoseClass = '';

        if (item.remaining === 0) {
            prognoseText = 'Ausverkauft';
            prognoseClass = 'status-critical';
        } else if (prognose === Infinity || avg7Days === 0) {
            prognoseText = 'Keine Daten';
            prognoseClass = '';
        } else if (prognose < 1) {
            prognoseText = '< 1 Tag';
            prognoseClass = 'status-critical';
        } else if (prognose < 3) {
            prognoseText = `~${Math.round(prognose)} Tage`;
            prognoseClass = 'status-warning';
        } else {
            prognoseText = `~${Math.round(prognose)} Tage`;
            prognoseClass = 'status-good';
        }

        let remainingClass = '';
        if (item.remaining < 0) remainingClass = 'negative';
        else if (item.remaining === 0) remainingClass = 'zero';

        return `
            <tr>
                <td class="product-name">${escapeHtml(item.product.name)}</td>
                <td class="text-center">${item.received}</td>
                <td class="text-center">${item.sold}</td>
                <td class="text-center ${remainingClass}"><strong>${item.remaining}</strong></td>
                <td class="text-center">${avg7Days.toFixed(1)}/Tag</td>
                <td class="text-center ${prognoseClass}">${prognoseText}</td>
            </tr>
        `;
    }).join('');
}

// ===========================
// UTILITIES
// ===========================

function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + '€';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===========================
// SCHULDBUCH / DEBT MANAGEMENT
// ===========================

function showAddDebtorDialog() {
    console.log('showAddDebtorDialog called');
    document.getElementById('debtor-modal').classList.add('show');

    // Update suggestions
    const datalist = document.getElementById('debtor-suggestions');
    datalist.innerHTML = debtors.map(d => `<option value="${d.name}">`).join('');
}

function closeDebtorModal() {
    document.getElementById('debtor-modal').classList.remove('show');
    document.getElementById('debtor-form').reset();
}

function handleDebtorFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get('debtor-name').trim();
    const initialDebt = parseFloat(formData.get('initial-debt')) || 0;

    if (!name) {
        showToast('Bitte Namen eingeben');
        return;
    }

    if (initialDebt < 0) {
        showToast('Schuld kann nicht negativ sein');
        return;
    }

    addDebtor(name, initialDebt);
    closeDebtorModal();
}

function addDebtor(name, initialDebt = 0) {
    let debtor = debtors.find(d => d.name.toLowerCase() === name.toLowerCase());

    if (!debtor) {
        debtor = {
            id: generateId(),
            name: name,
            debt: initialDebt,
            transactions: [],
            createdAt: new Date().toISOString()
        };

        // Wenn eine initiale Schuld angegeben wurde, Transaktion erstellen
        if (initialDebt > 0) {
            debtor.transactions.push({
                id: generateId(),
                type: 'initial',
                amount: initialDebt,
                timestamp: new Date().toISOString(),
                note: 'Initiale Schuld erfasst'
            });
        }

        debtors.push(debtor);
        console.log('Neuer Schuldner erstellt:', debtor);
    } else {
        // Wenn Schuldner bereits existiert und eine initiale Schuld angegeben wurde
        if (initialDebt > 0) {
            debtor.debt += initialDebt;
            debtor.transactions.push({
                id: generateId(),
                type: 'purchase',
                amount: initialDebt,
                timestamp: new Date().toISOString(),
                note: 'Nachträgliche Schuld erfasst'
            });
        }
    }

    saveDebtors();
    renderAll();

    if (initialDebt > 0) {
        showToast(`${name} wurde mit ${formatPrice(initialDebt)} Schulden hinzugefügt`);
    } else {
        showToast(`${name} wurde hinzugefügt`);
    }
}

function addDebtPurchase(debtorId, product) {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) {
        showToast('Schuldner nicht gefunden');
        return;
    }

    // Create sale
    const sale = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        price: product.price,
        timestamp: new Date().toISOString(),
        debtorId: debtorId,
        isDebt: true
    };

    // Add to debt
    debtor.debt += product.price;
    debtor.transactions.push({
        id: generateId(),
        type: 'purchase',
        amount: product.price,
        productName: product.name,
        timestamp: sale.timestamp,
        saleId: sale.id
    });

    // Add to sales
    sales.push(sale);
    saveSales();
    saveDebtors();
    updateDebtInfo(debtorId);
    renderAll();
    renderDebtTransactions(debtorId);

    showToast(`${product.name} auf Schuld verkauft an ${debtor.name} (Schulden: ${formatPrice(debtor.debt)})`);
}

function showAddDebtAmountDialog() {
    if (!selectedDebtorId) {
        showToast('Keine Person ausgewählt');
        return;
    }

    document.getElementById('add-debt-amount-modal').classList.add('show');
    document.getElementById('debt-amount').focus();
}

function closeAddDebtAmountModal() {
    document.getElementById('add-debt-amount-modal').classList.remove('show');
    document.getElementById('add-debt-amount-form').reset();
}

function handleAddDebtAmountFormSubmit(e) {
    e.preventDefault();

    if (!selectedDebtorId) {
        showToast('Keine Person ausgewählt');
        return;
    }

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('debt-amount'));
    const note = formData.get('debt-note').trim();

    if (isNaN(amount) || amount <= 0) {
        showToast('Bitte gültigen Betrag eingeben');
        return;
    }

    addDebtAmount(selectedDebtorId, amount, note);
    closeAddDebtAmountModal();
}

function addDebtAmount(debtorId, amount, note = '') {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) {
        showToast('Schuldner nicht gefunden');
        return;
    }

    debtor.debt += amount;
    debtor.transactions.push({
        id: generateId(),
        type: 'manual',
        amount: amount,
        timestamp: new Date().toISOString(),
        note: note || 'Manuell hinzugefügt'
    });

    saveDebtors();
    updateDebtInfo(debtorId);
    renderAll();
    renderDebtTransactions(debtorId);

    showToast(`${formatPrice(amount)} zur Schuld hinzugefügt (Gesamt: ${formatPrice(debtor.debt)})`);
}

function showPayDebtDialog() {
    if (!selectedDebtorId) {
        showToast('Keine Person ausgewählt');
        return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    if (!debtor) {
        showToast('Schuldner nicht gefunden');
        return;
    }

    document.getElementById('payment-amount').value = debtor.debt.toFixed(2);
    document.getElementById('pay-debt-modal').classList.add('show');
}

function setFullDebtAmount() {
    if (!selectedDebtorId) {
        return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    if (!debtor) {
        return;
    }

    // Setze auf 0 für "Schuld als beglichen markieren"
    document.getElementById('payment-amount').value = '0';
}

function closePayDebtModal() {
    document.getElementById('pay-debt-modal').classList.remove('show');
    document.getElementById('pay-debt-form').reset();
}

function handlePayDebtFormSubmit(e) {
    e.preventDefault();

    if (!selectedDebtorId) {
        showToast('Keine Person ausgewählt');
        return;
    }

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('payment-amount'));

    if (isNaN(amount) || amount < 0) {
        showToast('Bitte gültigen Betrag eingeben');
        return;
    }

    payDebt(selectedDebtorId, amount);
    closePayDebtModal();
}

function payDebt(debtorId, amount) {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) {
        showToast('Schuldner nicht gefunden');
        return;
    }

    if (amount > debtor.debt) {
        showToast('Betrag ist höher als die Schulden');
        return;
    }

    // Wenn Betrag 0 ist, Schuld komplett als beglichen markieren (Erlass)
    if (amount === 0) {
        debtor.debt = 0;
        debtor.transactions.push({
            id: generateId(),
            type: 'payment',
            amount: 0,
            timestamp: new Date().toISOString(),
            note: 'Schuld als beglichen markiert (ohne Zahlung)'
        });
        saveDebtors();
        updateDebtInfo(debtorId);
        renderAll();
        renderDebtTransactions(debtorId);
        showToast(`${debtor.name} wurde als schuldenfrei markiert`);
        return;
    }

    debtor.debt -= amount;
    debtor.transactions.push({
        id: generateId(),
        type: 'payment',
        amount: -amount,
        timestamp: new Date().toISOString(),
        note: 'Zahlung erhalten'
    });

    saveDebtors();
    updateDebtInfo(debtorId);
    renderAll();
    renderDebtTransactions(debtorId);

    if (debtor.debt === 0) {
        showToast(`${debtor.name} hat alle Schulden beglichen!`);
    } else {
        showToast(`${formatPrice(amount)} von ${debtor.name} erhalten (Restschuld: ${formatPrice(debtor.debt)})`);
    }
}

function deleteDebtor(debtorId) {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) return;

    confirmAction(
        'Schuldner löschen',
        `Möchten Sie "${debtor.name}" (${formatPrice(debtor.debt)}) wirklich löschen?`,
        () => {
            debtors = debtors.filter(d => d.id !== debtorId);
            saveDebtors();

            if (selectedDebtorId === debtorId) {
                clearDebtPersonSelection();
            }

            renderAll();
            showToast('Schuldner gelöscht');
        }
    );
}

// Alphabet-Filter für Schuldbuch initialisieren
function initDebtAlphabetFilter() {
    const filterContainer = document.getElementById('debt-alphabet-filter');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // Clear existing
    filterContainer.innerHTML = '<button class="alphabet-btn active" data-letter="all">Alle</button>';

    alphabet.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'alphabet-btn';
        btn.dataset.letter = letter;
        btn.textContent = letter;
        btn.addEventListener('click', () => setDebtAlphabetFilter(letter));
        filterContainer.appendChild(btn);
    });

    filterContainer.querySelector('[data-letter="all"]').addEventListener('click', () => setDebtAlphabetFilter('all'));
}

function setDebtAlphabetFilter(letter) {
    currentDebtAlphabetFilter = letter;

    document.querySelectorAll('#debt-alphabet-filter .alphabet-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.letter === letter);
    });

    renderDebtorsGrid();
}

function renderDebtorsGrid() {
    const container = document.getElementById('debtors-grid');

    // Filter debtors
    let filteredDebtors = showPaidDebts
        ? debtors
        : debtors.filter(d => d.debt > 0);

    // Filter by alphabet
    if (currentDebtAlphabetFilter !== 'all') {
        filteredDebtors = filteredDebtors.filter(d => {
            const lastName = getLastName(d.name);
            return lastName.toUpperCase().startsWith(currentDebtAlphabetFilter);
        });
    }

    // Sort by last name
    filteredDebtors = filteredDebtors.sort((a, b) => {
        const lastNameA = getLastName(a.name);
        const lastNameB = getLastName(b.name);
        return lastNameA.localeCompare(lastNameB, 'de');
    });

    // Update count
    document.getElementById('debtors-count').textContent = debtors.filter(d => d.debt > 0).length;

    if (filteredDebtors.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Schuldner gefunden</p>';
        return;
    }

    container.innerHTML = filteredDebtors.map(debtor => {
        const debtClass = debtor.debt > 0 ? 'has-debt' : 'paid';
        const isSelected = selectedDebtorId === debtor.id;

        return `
            <div class="person-card-credits debt-card ${debtClass} ${isSelected ? 'selected' : ''}"
                 onclick="selectDebtorById('${debtor.id}')">
                <div class="person-info">
                    <div class="person-name">${escapeHtml(debtor.name)}</div>
                    <div class="debt-amount ${debtor.debt > 0 ? 'negative' : 'zero'}">${formatPrice(debtor.debt)}</div>
                </div>
                <button class="btn-delete btn-small" onclick="event.stopPropagation(); deleteDebtor('${debtor.id}')">
                    Löschen
                </button>
            </div>
        `;
    }).join('');

    // Initialize alphabet filter if not done yet
    if (!document.querySelector('#debt-alphabet-filter .alphabet-btn[data-letter="A"]')) {
        initDebtAlphabetFilter();
    }
}

function selectDebtorById(debtorId) {
    selectedDebtorId = debtorId;
    const debtor = debtors.find(d => d.id === debtorId);

    if (debtor) {
        document.getElementById('debt-info-person-name').textContent = debtor.name;
        document.getElementById('debt-info-person-debt').textContent = formatPrice(debtor.debt);
        document.getElementById('debt-active-section').style.display = 'block';
        document.getElementById('debt-products-section').style.display = 'block';
        document.getElementById('debt-history-section').style.display = 'block';

        renderDebtProducts();
        renderDebtTransactions(debtorId);
        renderDebtorsGrid();

        document.getElementById('debt-active-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function clearDebtPersonSelection() {
    selectedDebtorId = null;
    document.getElementById('debt-active-section').style.display = 'none';
    document.getElementById('debt-products-section').style.display = 'none';
    document.getElementById('debt-history-section').style.display = 'none';
    renderDebtorsGrid();
}

function updateDebtInfo(debtorId) {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) return;

    // Aktualisiere nur die Schuld-Anzeige im Info-Bereich
    const debtElement = document.getElementById('debt-info-person-debt');
    if (debtElement) {
        debtElement.textContent = formatPrice(debtor.debt);
    }
}

function renderDebtProducts() {
    const grid = document.getElementById('debt-products-grid');
    const debtorId = selectedDebtorId;

    if (!debtorId || products.length === 0) {
        return;
    }

    grid.innerHTML = '';

    // Group products by category
    const groupedProducts = {};
    products.forEach(product => {
        if (!groupedProducts[product.category]) {
            groupedProducts[product.category] = [];
        }
        groupedProducts[product.category].push(product);
    });

    // Sort products within each category
    Object.keys(groupedProducts).forEach(category => {
        groupedProducts[category].sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
        });
    });

    // Define category labels and order
    const categoryLabels = {
        drinks: 'Getränke',
        alcohol: 'Alkoholische Getränke',
        snacks: 'Snacks'
    };

    const categoryOrder = ['drinks', 'alcohol', 'snacks'];

    // Render products by category
    categoryOrder.forEach(category => {
        if (groupedProducts[category] && groupedProducts[category].length > 0) {
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = categoryLabels[category] || category;
            grid.appendChild(header);

            groupedProducts[category].forEach(product => {
                const btn = document.createElement('button');
                btn.className = `product-btn ${product.category}`;
                btn.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                `;
                btn.addEventListener('click', () => addDebtPurchase(debtorId, product));
                grid.appendChild(btn);
            });
        }
    });

    // Render any products with unknown categories
    Object.keys(groupedProducts).forEach(category => {
        if (!categoryOrder.includes(category)) {
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            grid.appendChild(header);

            groupedProducts[category].forEach(product => {
                const btn = document.createElement('button');
                btn.className = `product-btn ${product.category}`;
                btn.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                `;
                btn.addEventListener('click', () => addDebtPurchase(debtorId, product));
                grid.appendChild(btn);
            });
        }
    });
}

function renderDebtTransactions(debtorId) {
    const container = document.getElementById('debt-transactions');
    const debtor = debtors.find(d => d.id === debtorId);

    if (!debtor || !debtor.transactions || debtor.transactions.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Transaktionen</p>';
        return;
    }

    const sortedTransactions = [...debtor.transactions].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    container.innerHTML = sortedTransactions.map(transaction => {
        const isPayment = transaction.type === 'payment';
        const isInitial = transaction.type === 'initial';
        const isManual = transaction.type === 'manual';
        const amountClass = isPayment ? 'positive' : 'negative';

        let label = 'Kauf';
        if (isPayment) {
            label = 'Zahlung';
        } else if (isInitial) {
            label = 'Initiale Schuld';
        } else if (isManual) {
            label = 'Betrag hinzugefügt';
        } else if (transaction.productName) {
            label = transaction.productName;
        }

        return `
            <div class="debt-transaction-item">
                <div class="transaction-time">${formatTime(transaction.timestamp)}</div>
                <div class="transaction-info">
                    ${label}
                    ${transaction.note ? `<small>(${transaction.note})</small>` : ''}
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${isPayment ? '-' : '+'}${formatPrice(Math.abs(transaction.amount))}
                </div>
            </div>
        `;
    }).join('');
}

// ===========================
// EXPOSE FOR INLINE HANDLERS
// ===========================

window.deleteSale = deleteSale;
window.quickAddCredit = quickAddCredit;
window.deletePerson = deletePerson;
window.switchTab = switchTab;
window.showAddCreditDialog = showAddCreditDialog;
window.confirmAddLoyaltyCard = confirmAddLoyaltyCard;
window.cancelAddLoyaltyCard = cancelAddLoyaltyCard;
window.removePersonLoyaltyCard = removePersonLoyaltyCard;
window.selectCreditsPersonById = selectCreditsPersonById;
window.clearCreditsPersonSelection = clearCreditsPersonSelection;
window.showAddDebtorDialog = showAddDebtorDialog;
window.selectDebtorById = selectDebtorById;
window.clearDebtPersonSelection = clearDebtPersonSelection;
window.deleteDebtor = deleteDebtor;
window.showAddDebtAmountDialog = showAddDebtAmountDialog;
window.showPayDebtDialog = showPayDebtDialog;
window.setFullDebtAmount = setFullDebtAmount;
