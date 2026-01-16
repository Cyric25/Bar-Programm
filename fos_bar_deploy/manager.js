// ===========================
// STATE & STORAGE
// ===========================

let products = [];
let loyaltyCardTypes = [];
let categories = [];
let users = [];
let editingProductId = null;
let editingCardTypeId = null;
let editingCategoryId = null;
let editingUserId = null;
let currentCategoryFilter = 'all';

// Bilanz Zeitraum-State
let bilanzPeriodType = 'day'; // 'day', 'week', 'month'
let bilanzPeriodOffset = 0;   // 0 = aktuell, -1 = vorherige Periode, etc.

// ===========================
// HELPER FUNCTIONS
// ===========================

// Parst Euro-Beträge: akzeptiert Komma oder Punkt als Dezimaltrennzeichen
function parseEuro(value) {
    if (value === null || value === undefined || value === '') return 0;
    // Ersetze Komma durch Punkt für parseFloat
    const normalized = String(value).replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Manager.js loaded!');
    try {
        await loadCategories();
        await loadProducts();
        await loadLoyaltyCardTypes();
        initEventListeners();
        renderCategories();
        renderCategorySelectors();
        renderCategoryFilter();
        renderProducts();
        renderLoyaltyCardTypes();
    } catch (error) {
        console.error('Initialisierungsfehler:', error);
        showToast('Fehler beim Laden der Daten. Ist der Server erreichbar?', 'error');
    }
});

// ===========================
// DATA LOADING & SAVING (via API)
// ===========================

async function loadProducts() {
    try {
        products = await apiGet('products');
        console.log('Produkte aus API geladen:', products.length);
    } catch (error) {
        console.error('Fehler beim Laden der Produkte:', error);
        products = [];
    }
}

async function saveProducts() {
    try {
        await apiPost('products', products);
        console.log('Produkte gespeichert:', products.length);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showToast('Fehler beim Speichern der Produkte', 'error');
    }
}

async function loadLoyaltyCardTypes() {
    try {
        loyaltyCardTypes = await apiGet('loyalty_card_types');
        console.log('Treuekarten-Typen aus API geladen:', loyaltyCardTypes.length);
    } catch (error) {
        console.error('Fehler beim Laden der Treuekarten-Typen:', error);
        loyaltyCardTypes = [];
    }
}

async function saveLoyaltyCardTypes() {
    try {
        await apiPost('loyalty_card_types', loyaltyCardTypes);
        console.log('Treuekarten-Typen gespeichert:', loyaltyCardTypes.length);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showToast('Fehler beim Speichern der Treuekarten', 'error');
    }
}

async function loadCategories() {
    try {
        categories = await apiGet('categories');
        console.log('Kategorien aus API geladen:', categories.length);
        if (categories.length === 0) {
            categories = getDefaultCategories();
        }
    } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
        categories = getDefaultCategories();
    }
}

async function saveCategories() {
    try {
        await apiPost('categories', categories);
        console.log('Kategorien gespeichert:', categories.length);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showToast('Fehler beim Speichern der Kategorien', 'error');
    }
}

function getDefaultCategories() {
    return [
        { id: 'drinks', label: 'Getränke' },
        { id: 'alcohol', label: 'Alkoholische Getränke' },
        { id: 'snacks', label: 'Snacks' }
    ];
}

// ===========================
// EVENT LISTENERS
// ===========================

function initEventListeners() {
    console.log('📋 Initializing event listeners...');
    // Tab navigation
    console.log('🔧 Setting up tab listeners...');
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log('Found', tabButtons.length, 'tab buttons');

    tabButtons.forEach(btn => {
        console.log('Adding listener to button:', btn.dataset.tab);
        btn.addEventListener('click', (e) => {
            console.log('Tab clicked:', btn.dataset.tab);
            switchTab(btn.dataset.tab);
        });
    });

    console.log('✅ Tab listeners set up!');

    // Original event listeners continue here...

    // Category Management
    document.getElementById('btn-add-category').addEventListener('click', showCategoryForm);
    document.getElementById('category-form').addEventListener('submit', handleCategoryFormSubmit);
    document.getElementById('btn-category-cancel').addEventListener('click', resetCategoryForm);

    // Form submission
    document.getElementById('product-form').addEventListener('submit', handleFormSubmit);

    // Cancel button
    document.getElementById('btn-cancel').addEventListener('click', resetForm);

    // Produkt Export/Import (Verwaltung Tab)
    document.getElementById('btn-export').addEventListener('click', exportProducts);
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', importProducts);

    // Bilanz: Zeitraum-Auswahl
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => setBilanzPeriodType(btn.dataset.period));
    });

    // Bilanz: Navigation
    const prevBtn = document.getElementById('period-prev');
    const nextBtn = document.getElementById('period-next');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateBilanzPeriod(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateBilanzPeriod(1));

    // Bilanz: Export
    const exportPeriodBtn = document.getElementById('btn-export-period');
    const exportCsvBtn = document.getElementById('btn-export-csv');
    const exportExcelBtn = document.getElementById('btn-export-excel');
    if (exportPeriodBtn) exportPeriodBtn.addEventListener('click', exportPeriodData);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportFullDatabaseCSV);
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportExcelByCategory);

    // Modal
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-confirm').addEventListener('click', executeModalAction);

    // Loyalty Cards
    document.getElementById('loyalty-form').addEventListener('submit', handleLoyaltyFormSubmit);
    document.getElementById('btn-loyalty-cancel').addEventListener('click', resetLoyaltyForm);

    // Dynamic form field toggle
    document.getElementById('loyalty-type').addEventListener('change', toggleLoyaltyTypeFields);
    document.getElementById('loyalty-binding').addEventListener('change', toggleBindingFields);

    // Populate product selector and initialize form fields
    populateProductSelector();
    toggleLoyaltyTypeFields();
    toggleBindingFields();

    // Inventar-Formular
    const inventoryForm = document.getElementById('inventory-form');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', handleInventoryFormSubmit);
    }

    // Benutzer-Formular
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }

    const userCancelBtn = document.getElementById('btn-user-cancel');
    if (userCancelBtn) {
        userCancelBtn.addEventListener('click', resetUserForm);
    }

    // Aktivitäts-Log Filter
    const activityFilter = document.getElementById('activity-user-filter');
    if (activityFilter) {
        activityFilter.addEventListener('change', renderActivityLog);
    }

    const refreshActivityBtn = document.getElementById('btn-refresh-activity');
    if (refreshActivityBtn) {
        refreshActivityBtn.addEventListener('click', renderActivityLog);
    }

    // Vorbestellungs-Formular
    const preorderSettingsForm = document.getElementById('preorder-settings-form');
    if (preorderSettingsForm) {
        preorderSettingsForm.addEventListener('submit', handlePreorderSettingsSubmit);
    }

    const preorderStatusFilter = document.getElementById('preorder-status-filter');
    if (preorderStatusFilter) {
        preorderStatusFilter.addEventListener('change', async () => {
            const status = preorderStatusFilter.value || null;
            await loadPreorders(status);
            renderPreordersList();
        });
    }

    const refreshPreordersBtn = document.getElementById('btn-refresh-preorders');
    if (refreshPreordersBtn) {
        refreshPreordersBtn.addEventListener('click', async () => {
            const status = document.getElementById('preorder-status-filter')?.value || null;
            await loadPreorders(status);
            renderPreordersList();
        });
    }
}

async function handlePreorderSettingsSubmit(e) {
    e.preventDefault();

    preorderSettings = {
        enabled: document.getElementById('preorder-enabled').checked,
        start_time: document.getElementById('preorder-start-time').value,
        end_time: document.getElementById('preorder-end-time').value
    };

    await savePreorderSettings();
}

// ===========================
// FORM HANDLING
// ===========================

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const sortOrder = formData.get('sortOrder');
    const productData = {
        name: formData.get('name').trim(),
        price: parseEuro(formData.get('price')),
        category: formData.get('category'),
        sortOrder: sortOrder ? parseInt(sortOrder) : undefined
    };

    // Validation
    if (!productData.name) {
        showToast('Bitte Produktname eingeben', 'error');
        return;
    }

    if (productData.price <= 0) {
        showToast('Preis muss größer als 0 sein', 'error');
        return;
    }

    if (editingProductId) {
        // Update existing product
        updateProduct(editingProductId, productData);
    } else {
        // Add new product
        addProduct(productData);
    }
}

function addProduct(productData) {
    const product = {
        id: generateId(productData.name),
        ...productData
    };

    // Check if ID already exists
    if (products.find(p => p.id === product.id)) {
        showToast('Ein Produkt mit diesem Namen existiert bereits', 'error');
        return;
    }

    products.push(product);
    saveProducts();
    renderProducts();
    resetForm();
    showToast(`${product.name} wurde hinzugefügt`, 'success');
}

function updateProduct(productId, productData) {
    const index = products.findIndex(p => p.id === productId);

    if (index === -1) {
        showToast('Produkt nicht gefunden', 'error');
        return;
    }

    products[index] = {
        id: productId,
        ...productData
    };

    saveProducts();
    renderProducts();
    resetForm();
    showToast('Produkt wurde aktualisiert', 'success');
}

function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);

    if (!product) {
        showToast('Produkt nicht gefunden', 'error');
        return;
    }

    confirmAction(
        'Produkt löschen',
        `Möchten Sie "${product.name}" wirklich löschen?`,
        () => {
            products = products.filter(p => p.id !== productId);
            saveProducts();
            renderProducts();
            showToast('Produkt wurde gelöscht', 'success');
        }
    );
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);

    if (!product) {
        showToast('Produkt nicht gefunden', 'error');
        return;
    }

    // Fill form with product data
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-sort-order').value = product.sortOrder !== undefined ? product.sortOrder : '';

    // Update UI
    document.getElementById('form-title').textContent = 'Produkt bearbeiten';
    document.getElementById('btn-submit').textContent = 'Produkt aktualisieren';
    document.getElementById('btn-cancel').classList.remove('hidden');

    editingProductId = productId;

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('form-title').textContent = 'Neues Produkt hinzufügen';
    document.getElementById('btn-submit').textContent = 'Produkt hinzufügen';
    document.getElementById('btn-cancel').classList.add('hidden');
    editingProductId = null;
}

// ===========================
// RENDERING
// ===========================

function renderProducts() {
    const filteredProducts = currentCategoryFilter === 'all'
        ? products
        : products.filter(p => p.category === currentCategoryFilter);

    const container = document.getElementById('products-list');

    // Update counts
    updateCounts();

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Produkte in dieser Kategorie</p>';
        return;
    }

    // Sort alphabetically
    const sorted = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = sorted.map(product => `
        <div class="product-card ${product.category}">
            <div class="product-info">
                <div class="product-header">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <span class="product-category ${product.category}">
                        ${getCategoryLabel(product.category)}
                    </span>
                </div>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-id">ID: ${product.id}</div>
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct('${product.id}')">
                    Bearbeiten
                </button>
                <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                    Löschen
                </button>
            </div>
        </div>
    `).join('');
}

function updateCounts() {
    const countAll = products.length;
    document.getElementById('product-count').textContent = countAll;

    const countAllElement = document.getElementById('count-all');
    if (countAllElement) {
        countAllElement.textContent = countAll;
    }

    categories.forEach(category => {
        const count = products.filter(p => p.category === category.id).length;
        const element = document.getElementById(`count-${category.id}`);
        if (element) {
            element.textContent = count;
        }
    });
}

// ===========================
// FILTERING
// ===========================

function filterByCategory(category) {
    currentCategoryFilter = category;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    renderProducts();
}

// ===========================
// EXPORT / IMPORT
// ===========================

function exportProducts() {
    const data = {
        products: products
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.json';
    link.click();

    URL.revokeObjectURL(url);
    showToast('Produkte wurden exportiert', 'success');
}

function importProducts(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.products || !Array.isArray(data.products)) {
                throw new Error('Ungültiges Format');
            }

            // Validate products
            const validProducts = data.products.filter(p => {
                return p.id && p.name && typeof p.price === 'number' && p.category;
            });

            if (validProducts.length === 0) {
                throw new Error('Keine gültigen Produkte gefunden');
            }

            confirmAction(
                'Produkte importieren',
                `${validProducts.length} Produkte gefunden. Möchten Sie diese importieren? (Bestehende Produkte werden überschrieben)`,
                () => {
                    products = validProducts;
                    saveProducts();
                    renderProducts();
                    resetForm();
                    showToast(`${validProducts.length} Produkte wurden importiert`, 'success');
                }
            );

        } catch (error) {
            console.error('Import-Fehler:', error);
            showToast('Fehler beim Importieren: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
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
// UI HELPERS
// ===========================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// UTILITIES
// ===========================

function generateId(name) {
    // Create a simple ID from the name
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + '€';
}

function getCategoryLabel(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.label : categoryId;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// LOYALTY CARDS MANAGEMENT
// ===========================

function handleLoyaltyFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const type = formData.get('type');
    const bindingType = formData.get('bindingType');

    const cardTypeData = {
        name: formData.get('name').trim(),
        type: type,
        bindingType: bindingType,
        description: formData.get('description').trim() || undefined,
        allowUpgrade: document.getElementById('loyalty-allow-upgrade').checked
    };

    // Type-specific fields
    if (type === 'buy_n_get_1') {
        cardTypeData.requiredPurchases = parseInt(formData.get('requiredPurchases'));
    } else if (type === 'pay_n_get_m') {
        cardTypeData.payCount = parseInt(formData.get('payCount'));
        cardTypeData.getCount = parseInt(formData.get('getCount'));
    }

    // Binding-specific fields
    if (bindingType === 'product') {
        cardTypeData.productId = formData.get('productId');
    } else if (bindingType === 'products') {
        const selectedOptions = Array.from(document.getElementById('loyalty-products').selectedOptions);
        cardTypeData.productIds = selectedOptions.map(opt => opt.value);

        // Validation: mindestens 2 Produkte, alle gleicher Preis
        if (cardTypeData.productIds.length < 2) {
            showToast('Bitte mindestens 2 Produkte auswählen', 'error');
            return;
        }

        // Prüfen ob alle den gleichen Preis haben
        const prices = cardTypeData.productIds.map(id => {
            const p = products.find(prod => prod.id === id);
            return p ? p.price : null;
        });

        const firstPrice = prices[0];
        const allSamePrice = prices.every(p => p === firstPrice);

        if (!allSamePrice) {
            showToast('Alle ausgewählten Produkte müssen den gleichen Preis haben!', 'error');
            return;
        }
    } else if (bindingType === 'category') {
        cardTypeData.categoryId = formData.get('categoryId');
    }

    // Validation
    if (!cardTypeData.name) {
        showToast('Bitte Namen eingeben', 'error');
        return;
    }

    if (type === 'buy_n_get_1' && (!cardTypeData.requiredPurchases || cardTypeData.requiredPurchases < 1)) {
        showToast('Bitte gültige Anzahl Käufe eingeben', 'error');
        return;
    }

    if (type === 'pay_n_get_m') {
        if (!cardTypeData.payCount || cardTypeData.payCount < 1 || !cardTypeData.getCount || cardTypeData.getCount < 1) {
            showToast('Bitte gültige Zahlen eingeben', 'error');
            return;
        }
        if (cardTypeData.getCount <= cardTypeData.payCount) {
            showToast('Bekomme-Anzahl muss größer als Zahle-Anzahl sein', 'error');
            return;
        }
    }

    if (editingCardTypeId) {
        updateLoyaltyCardType(editingCardTypeId, cardTypeData);
    } else {
        addLoyaltyCardType(cardTypeData);
    }
}

function addLoyaltyCardType(cardTypeData) {
    const cardType = {
        id: 'lct_' + generateId(cardTypeData.name),
        ...cardTypeData,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    // Check if ID already exists
    if (loyaltyCardTypes.find(ct => ct.id === cardType.id)) {
        showToast('Eine Treuekarte mit diesem Namen existiert bereits', 'error');
        return;
    }

    loyaltyCardTypes.push(cardType);
    saveLoyaltyCardTypes();
    renderLoyaltyCardTypes();
    resetLoyaltyForm();
    showToast(`Treuekarte "${cardType.name}" wurde erstellt`, 'success');
}

function updateLoyaltyCardType(cardTypeId, cardTypeData) {
    const index = loyaltyCardTypes.findIndex(ct => ct.id === cardTypeId);

    if (index === -1) {
        showToast('Treuekarte nicht gefunden', 'error');
        return;
    }

    loyaltyCardTypes[index] = {
        ...loyaltyCardTypes[index],
        ...cardTypeData
    };

    saveLoyaltyCardTypes();
    renderLoyaltyCardTypes();
    resetLoyaltyForm();
    showToast('Treuekarte wurde aktualisiert', 'success');
}

function deleteLoyaltyCardType(cardTypeId) {
    const cardType = loyaltyCardTypes.find(ct => ct.id === cardTypeId);

    if (!cardType) {
        showToast('Treuekarte nicht gefunden', 'error');
        return;
    }

    confirmAction(
        'Treuekarte löschen',
        `Möchten Sie "${cardType.name}" wirklich löschen? Alle aktiven Stempelkarten bei Personen bleiben erhalten.`,
        () => {
            loyaltyCardTypes = loyaltyCardTypes.filter(ct => ct.id !== cardTypeId);
            saveLoyaltyCardTypes();
            renderLoyaltyCardTypes();
            showToast('Treuekarte wurde gelöscht', 'success');
        }
    );
}

function editLoyaltyCardType(cardTypeId) {
    const cardType = loyaltyCardTypes.find(ct => ct.id === cardTypeId);

    if (!cardType) {
        showToast('Treuekarte nicht gefunden', 'error');
        return;
    }

    // Fill form
    document.getElementById('loyalty-name').value = cardType.name;
    document.getElementById('loyalty-type').value = cardType.type;
    document.getElementById('loyalty-binding').value = cardType.bindingType;
    document.getElementById('loyalty-description').value = cardType.description || '';
    document.getElementById('loyalty-allow-upgrade').checked = cardType.allowUpgrade || false;

    if (cardType.type === 'buy_n_get_1') {
        document.getElementById('loyalty-required').value = cardType.requiredPurchases;
    } else if (cardType.type === 'pay_n_get_m') {
        document.getElementById('loyalty-pay-count').value = cardType.payCount;
        document.getElementById('loyalty-get-count').value = cardType.getCount;
    }

    if (cardType.bindingType === 'product') {
        document.getElementById('loyalty-product').value = cardType.productId;
    } else if (cardType.bindingType === 'products') {
        // Select multiple products in multi-select
        const productsSelect = document.getElementById('loyalty-products');
        Array.from(productsSelect.options).forEach(option => {
            option.selected = cardType.productIds.includes(option.value);
        });
    } else if (cardType.bindingType === 'category') {
        document.getElementById('loyalty-category').value = cardType.categoryId;
    }

    // Update UI
    document.getElementById('loyalty-form-title').textContent = 'Treuekarte bearbeiten';
    document.getElementById('btn-loyalty-submit').textContent = 'Treuekarte aktualisieren';
    document.getElementById('btn-loyalty-cancel').classList.remove('hidden');

    editingCardTypeId = cardTypeId;

    // Trigger field toggles
    toggleLoyaltyTypeFields();
    toggleBindingFields();

    // Scroll to form
    document.querySelector('.loyalty-form-section').scrollIntoView({ behavior: 'smooth' });
}

function toggleLoyaltyCardTypeActive(cardTypeId) {
    const cardType = loyaltyCardTypes.find(ct => ct.id === cardTypeId);

    if (!cardType) {
        showToast('Treuekarte nicht gefunden', 'error');
        return;
    }

    cardType.isActive = !cardType.isActive;
    saveLoyaltyCardTypes();
    renderLoyaltyCardTypes();
    showToast(`Treuekarte ${cardType.isActive ? 'aktiviert' : 'deaktiviert'}`, 'success');
}

function resetLoyaltyForm() {
    document.getElementById('loyalty-form').reset();
    document.getElementById('loyalty-form-title').textContent = 'Neue Treuekarte erstellen';
    document.getElementById('btn-loyalty-submit').textContent = 'Treuekarte erstellen';
    document.getElementById('btn-loyalty-cancel').classList.add('hidden');
    editingCardTypeId = null;
    toggleLoyaltyTypeFields();
    toggleBindingFields();
}

function renderLoyaltyCardTypes() {
    const container = document.getElementById('loyalty-list');
    document.getElementById('loyalty-count').textContent = loyaltyCardTypes.length;

    if (loyaltyCardTypes.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Treuekarten vorhanden</p>';
        return;
    }

    const sorted = [...loyaltyCardTypes].sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = sorted.map(cardType => {
        let bindingLabel;
        if (cardType.bindingType === 'product') {
            bindingLabel = `Produkt: ${getProductNameById(cardType.productId)}`;
        } else if (cardType.bindingType === 'products') {
            const productNames = cardType.productIds.map(id => getProductNameById(id)).join(', ');
            bindingLabel = `Produkte: ${productNames}`;
        } else {
            bindingLabel = `Kategorie: ${getCategoryLabel(cardType.categoryId)}`;
        }

        let typeLabel;
        if (cardType.type === 'buy_n_get_1') {
            typeLabel = `Kaufe ${cardType.requiredPurchases}, bekomme 1 gratis`;
        } else {
            typeLabel = `Zahle ${cardType.payCount}, bekomme ${cardType.getCount}`;
        }

        return `
            <div class="loyalty-card-item ${cardType.isActive ? '' : 'inactive'}">
                <div class="loyalty-card-info">
                    <div class="loyalty-card-name">${escapeHtml(cardType.name)}</div>
                    <div class="loyalty-card-details">${typeLabel}</div>
                    <span class="loyalty-card-binding">${bindingLabel}</span>
                    ${cardType.description ? `<div class="loyalty-card-description">${escapeHtml(cardType.description)}</div>` : ''}
                </div>
                <div class="loyalty-card-actions">
                    <button class="btn-edit" onclick="editLoyaltyCardType('${cardType.id}')">
                        Bearbeiten
                    </button>
                    <button class="btn-small ${cardType.isActive ? 'btn-warning' : 'btn-secondary'}"
                            onclick="toggleLoyaltyCardTypeActive('${cardType.id}')">
                        ${cardType.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button class="btn-delete" onclick="deleteLoyaltyCardType('${cardType.id}')">
                        Löschen
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleLoyaltyTypeFields() {
    const type = document.getElementById('loyalty-type').value;
    const isBuyNGet1 = type === 'buy_n_get_1';

    document.getElementById('required-purchases-group').classList.toggle('hidden', !isBuyNGet1);
    document.getElementById('pay-count-group').classList.toggle('hidden', isBuyNGet1);
    document.getElementById('get-count-group').classList.toggle('hidden', isBuyNGet1);
}

function toggleBindingFields() {
    const bindingType = document.getElementById('loyalty-binding').value;
    const isProduct = bindingType === 'product';
    const isProducts = bindingType === 'products';
    const isCategory = bindingType === 'category';

    document.getElementById('product-binding-group').classList.toggle('hidden', !isProduct);
    document.getElementById('products-binding-group').classList.toggle('hidden', !isProducts);
    document.getElementById('category-binding-group').classList.toggle('hidden', !isCategory);
}

function populateProductSelector() {
    // Single product select
    const select = document.getElementById('loyalty-product');
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

    select.innerHTML = sortedProducts
        .map(p => `<option value="${p.id}">${p.name} (${formatPrice(p.price)})</option>`)
        .join('');

    // Multiple products select
    const multiSelect = document.getElementById('loyalty-products');
    multiSelect.innerHTML = sortedProducts
        .map(p => `<option value="${p.id}">${p.name} (${formatPrice(p.price)})</option>`)
        .join('');
}

function getProductNameById(productId) {
    const product = products.find(p => p.id === productId);
    return product ? product.name : productId;
}

// ===========================
// CATEGORY MANAGEMENT
// ===========================

function showCategoryForm() {
    document.getElementById('category-form-wrapper').style.display = 'block';
    document.getElementById('category-id').focus();
}

function resetCategoryForm() {
    document.getElementById('category-form').reset();
    document.getElementById('category-form-wrapper').style.display = 'none';
    document.getElementById('btn-category-submit').textContent = 'Kategorie hinzufügen';
    document.getElementById('category-id').readOnly = false;
    editingCategoryId = null;
}

function handleCategoryFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const categoryData = {
        id: formData.get('id').trim().toLowerCase(),
        label: formData.get('label').trim(),
        color: formData.get('color') || '#3b82f6'
    };

    // Validation
    if (!categoryData.id || !categoryData.label) {
        showToast('Bitte alle Felder ausfüllen', 'error');
        return;
    }

    // Validate ID pattern
    if (!/^[a-z0-9_]+$/.test(categoryData.id)) {
        showToast('ID darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten', 'error');
        return;
    }

    if (editingCategoryId) {
        updateCategory(editingCategoryId, categoryData);
    } else {
        addCategory(categoryData);
    }
}

function addCategory(categoryData) {
    // Check if ID already exists
    if (categories.find(c => c.id === categoryData.id)) {
        showToast('Eine Kategorie mit dieser ID existiert bereits', 'error');
        return;
    }

    categories.push(categoryData);
    saveCategories();
    renderCategories();
    renderCategorySelectors();
    renderCategoryFilter();
    resetCategoryForm();
    showToast(`Kategorie "${categoryData.label}" wurde hinzugefügt`, 'success');
}

function updateCategory(categoryId, categoryData) {
    const index = categories.findIndex(c => c.id === categoryId);

    if (index === -1) {
        showToast('Kategorie nicht gefunden', 'error');
        return;
    }

    categories[index] = {
        id: categoryId,
        label: categoryData.label,
        color: categoryData.color
    };

    saveCategories();
    renderCategories();
    renderCategorySelectors();
    renderCategoryFilter();
    resetCategoryForm();
    showToast('Kategorie wurde aktualisiert', 'success');
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
        showToast('Kategorie nicht gefunden', 'error');
        return;
    }

    // Fill form
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-id').readOnly = true; // Can't change ID when editing
    document.getElementById('category-label').value = category.label;
    document.getElementById('category-color').value = category.color || '#3b82f6';

    // Show form
    document.getElementById('category-form-wrapper').style.display = 'block';
    document.getElementById('btn-category-submit').textContent = 'Kategorie aktualisieren';

    editingCategoryId = categoryId;
}

function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
        showToast('Kategorie nicht gefunden', 'error');
        return;
    }

    // Check if any products use this category
    const productsUsingCategory = products.filter(p => p.category === categoryId);

    if (productsUsingCategory.length > 0) {
        showToast(`Kategorie wird von ${productsUsingCategory.length} Produkt(en) verwendet und kann nicht gelöscht werden`, 'error');
        return;
    }

    confirmAction(
        'Kategorie löschen',
        `Möchten Sie "${category.label}" wirklich löschen?`,
        () => {
            categories = categories.filter(c => c.id !== categoryId);
            saveCategories();
            renderCategories();
            renderCategorySelectors();
            renderCategoryFilter();
            showToast('Kategorie wurde gelöscht', 'success');
        }
    );
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    document.getElementById('category-count').textContent = categories.length;

    if (categories.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Kategorien vorhanden</p>';
        return;
    }

    const sorted = [...categories].sort((a, b) => a.label.localeCompare(b.label));

    container.innerHTML = sorted.map(category => {
        const productCount = products.filter(p => p.category === category.id).length;
        const color = category.color || '#3b82f6';

        return `
            <div class="category-item" style="border-left: 4px solid ${color};">
                <div class="category-info">
                    <div class="category-name">
                        <span class="category-color-dot" style="background: ${color};"></span>
                        ${escapeHtml(category.label)}
                    </div>
                    <div class="category-id">ID: ${category.id}</div>
                    <div class="category-count">${productCount} Produkt(e)</div>
                </div>
                <div class="category-actions">
                    <button class="btn-edit" onclick="editCategory('${category.id}')">
                        Bearbeiten
                    </button>
                    <button class="btn-delete" onclick="deleteCategory('${category.id}')">
                        Löschen
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategorySelectors() {
    // Product category selector
    const productCategorySelect = document.getElementById('product-category');
    const currentProductCategory = productCategorySelect ? productCategorySelect.value : '';

    if (productCategorySelect) {
        productCategorySelect.innerHTML = categories
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(c => `<option value="${c.id}">${c.label}</option>`)
            .join('');

        if (currentProductCategory && categories.find(c => c.id === currentProductCategory)) {
            productCategorySelect.value = currentProductCategory;
        }
    }

    // Loyalty card category selector
    const loyaltyCategorySelect = document.getElementById('loyalty-category');
    const currentLoyaltyCategory = loyaltyCategorySelect ? loyaltyCategorySelect.value : '';

    if (loyaltyCategorySelect) {
        loyaltyCategorySelect.innerHTML = categories
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(c => `<option value="${c.id}">${c.label}</option>`)
            .join('');

        if (currentLoyaltyCategory && categories.find(c => c.id === currentLoyaltyCategory)) {
            loyaltyCategorySelect.value = currentLoyaltyCategory;
        }
    }
}

function renderCategoryFilter() {
    const filterContainer = document.getElementById('category-filter');

    let html = `
        <button class="filter-btn ${currentCategoryFilter === 'all' ? 'active' : ''}" data-category="all">
            Alle (<span id="count-all">0</span>)
        </button>
    `;

    categories.forEach(category => {
        html += `
            <button class="filter-btn ${currentCategoryFilter === category.id ? 'active' : ''}" data-category="${category.id}">
                ${escapeHtml(category.label)} (<span id="count-${category.id}">0</span>)
            </button>
        `;
    });

    filterContainer.innerHTML = html;

    // Add event listeners
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterByCategory(btn.dataset.category));
    });

    // Update counts
    updateCounts();
}

// Tab Navigation
function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Refresh data for specific tabs
    if (tabName === 'bilanz') {
        renderManagerBilanz();
    } else if (tabName === 'statistik') {
        renderManagerStatistik();
    } else if (tabName === 'inventar') {
        renderManagerInventar();
    } else if (tabName === 'benutzer') {
        renderManagerBenutzer();
    } else if (tabName === 'vorbestellung') {
        renderManagerVorbestellung();
    }
}

// Bilanz/Statistik/Inventar Funktionen (laden Daten via API)

// ===== BILANZ ZEITRAUM-FUNKTIONEN =====

function getBilanzPeriodDates() {
    const now = new Date();
    let startDate, endDate, label;

    if (bilanzPeriodType === 'day') {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + bilanzPeriodOffset);

        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

        if (bilanzPeriodOffset === 0) {
            label = 'Heute';
        } else if (bilanzPeriodOffset === -1) {
            label = 'Gestern';
        } else {
            label = targetDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    } else if (bilanzPeriodType === 'week') {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + (bilanzPeriodOffset * 7));

        // Montag dieser Woche
        const dayOfWeek = targetDate.getDay() || 7;
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() - dayOfWeek + 1);

        startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        endDate = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59);

        if (bilanzPeriodOffset === 0) {
            label = 'Diese Woche';
        } else if (bilanzPeriodOffset === -1) {
            label = 'Letzte Woche';
        } else {
            label = `${startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        }
    } else if (bilanzPeriodType === 'month') {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + bilanzPeriodOffset, 1);

        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

        const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                           'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        if (bilanzPeriodOffset === 0) {
            label = 'Dieser Monat';
        } else if (bilanzPeriodOffset === -1) {
            label = 'Letzter Monat';
        } else {
            label = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
        }
    }

    return { startDate, endDate, label };
}

function setBilanzPeriodType(type) {
    bilanzPeriodType = type;
    bilanzPeriodOffset = 0;

    // Update button states
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === type);
    });

    renderManagerBilanz();
}

function navigateBilanzPeriod(direction) {
    bilanzPeriodOffset += direction;
    // Keine zukünftigen Perioden erlauben
    if (bilanzPeriodOffset > 0) bilanzPeriodOffset = 0;
    renderManagerBilanz();
}

function filterSalesByPeriod(sales, startDate, endDate) {
    return sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= startDate && saleDate <= endDate;
    });
}

async function renderManagerBilanz() {
    console.log('Loading Bilanz data...');

    // Load sales data from API
    const sales = await loadSalesData();
    const { startDate, endDate, label } = getBilanzPeriodDates();
    const periodSales = filterSalesByPeriod(sales, startDate, endDate);

    // Update period label
    const periodLabel = document.getElementById('period-label');
    if (periodLabel) periodLabel.textContent = label;

    // Update summary
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.price, 0);
    const totalCount = periodSales.length;

    const bilanzTotal = document.getElementById('bilanz-total');
    const bilanzCount = document.getElementById('bilanz-count');

    if (bilanzTotal) bilanzTotal.textContent = formatPrice(totalRevenue);
    if (bilanzCount) bilanzCount.textContent = totalCount;

    // Update payment breakdown
    const cashTotal = periodSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.price, 0);
    const creditTotal = periodSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.price, 0);
    const debtTotal = periodSales.filter(s => s.paymentMethod === 'debt').reduce((sum, s) => sum + s.price, 0);

    const paymentBreakdown = document.getElementById('payment-breakdown');
    if (paymentBreakdown) {
        paymentBreakdown.innerHTML = `
            <span class="payment-item">Bar: ${formatPrice(cashTotal)}</span>
            <span class="payment-item">Guthaben: ${formatPrice(creditTotal)}</span>
            <span class="payment-item">Schuld: ${formatPrice(debtTotal)}</span>
        `;
    }

    // Render product breakdown
    renderProductBreakdown(periodSales);
}

function formatPrice(value) {
    return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ===== EXPORT FUNKTIONEN =====

async function exportPeriodData() {
    const sales = await loadSalesData();
    const { startDate, endDate, label } = getBilanzPeriodDates();
    const periodSales = filterSalesByPeriod(sales, startDate, endDate);

    const exportData = {
        period: label,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        exportDate: new Date().toISOString(),
        summary: {
            totalRevenue: periodSales.reduce((sum, s) => sum + s.price, 0),
            totalCount: periodSales.length
        },
        sales: periodSales
    };

    const filename = `bilanz_${bilanzPeriodType}_${startDate.toISOString().split('T')[0]}.json`;
    downloadJSON(exportData, filename);
    showToast(`${label} exportiert`);
}

async function exportFullDatabaseCSV() {
    showToast('Lade Daten...');

    try {
        // Lade alle Daten
        const [salesData, personsData, productsData, categoriesData, inventoryData, debtorsData, loyaltyTypesData] = await Promise.all([
            loadSalesData(),
            apiGet('persons'),
            apiGet('products'),
            apiGet('categories'),
            loadInventoryData(),
            apiGet('debtors'),
            apiGet('loyalty_card_types')
        ]);

        // CSV für Verkäufe
        let csv = 'VERKÄUFE\n';
        csv += 'ID;Produkt;Preis;Zeitpunkt;Zahlungsart;Person-ID;Treuestamp\n';
        salesData.forEach(sale => {
            csv += `${sale.id};"${sale.name}";${sale.price};"${sale.timestamp}";${sale.paymentMethod || 'cash'};${sale.personId || ''};${sale.loyaltyStamps || ''}\n`;
        });

        // CSV für Produkte
        csv += '\nPRODUKTE\n';
        csv += 'ID;Name;Preis;Kategorie;Sortierung\n';
        productsData.forEach(prod => {
            csv += `${prod.id};"${prod.name}";${prod.price};${prod.category || ''};${prod.sortOrder || ''}\n`;
        });

        // CSV für Kategorien
        csv += '\nKATEGORIEN\n';
        csv += 'ID;Bezeichnung\n';
        categoriesData.forEach(cat => {
            csv += `${cat.id};"${cat.label}"\n`;
        });

        // CSV für Personen (Gutschriften)
        csv += '\nPERSONEN (GUTSCHRIFTEN)\n';
        csv += 'ID;Name;Guthaben;Treuekarten\n';
        personsData.forEach(person => {
            const cardCount = person.loyaltyCards ? person.loyaltyCards.length : 0;
            csv += `${person.id};"${person.name}";${person.balance};${cardCount}\n`;
        });

        // CSV für Schuldner
        csv += '\nSCHULDNER\n';
        csv += 'ID;Name;Schulden\n';
        if (Array.isArray(debtorsData)) {
            debtorsData.forEach(debtor => {
                csv += `${debtor.id};"${debtor.name}";${debtor.totalDebt || debtor.debt || 0}\n`;
            });
        }

        // CSV für Inventar
        csv += '\nINVENTAR\n';
        csv += 'ID;Produkt-ID;Produkt;Menge;Datum\n';
        inventoryData.forEach(inv => {
            const prod = productsData.find(p => p.id === inv.productId);
            csv += `${inv.id};${inv.productId};"${prod ? prod.name : 'Unbekannt'}";${inv.quantity};"${inv.date}"\n`;
        });

        // CSV für Treuekarten-Typen
        csv += '\nTREUEKARTEN-TYPEN\n';
        csv += 'ID;Name;Typ;Erforderliche Stempel;Bonus\n';
        loyaltyTypesData.forEach(lt => {
            csv += `${lt.id};"${lt.name}";${lt.type};${lt.requiredStamps};${lt.bonusAmount}\n`;
        });

        // Download
        const filename = `fos_bar_datenbank_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
        showToast('Datenbank exportiert');
    } catch (error) {
        console.error('Export-Fehler:', error);
        showToast('Fehler beim Exportieren', 'error');
    }
}

async function exportExcelByCategory() {
    if (typeof XLSX === 'undefined') {
        showToast('Excel-Bibliothek nicht geladen', 'error');
        return;
    }

    showToast('Erstelle Excel-Datei...');

    try {
        // Lade alle Daten
        const [salesData, productsData, categoriesData] = await Promise.all([
            loadSalesData(),
            apiGet('products'),
            apiGet('categories')
        ]);

        // Erstelle Workbook
        const wb = XLSX.utils.book_new();

        // Gruppiere Verkäufe nach Kategorie
        const salesByCategory = {};
        const categoryTotals = {};

        salesData.forEach(sale => {
            // Finde Produkt und dessen Kategorie
            const product = productsData.find(p => p.name === sale.name);
            const categoryId = product ? (product.category || 'other') : 'other';

            if (!salesByCategory[categoryId]) {
                salesByCategory[categoryId] = [];
                categoryTotals[categoryId] = { count: 0, total: 0 };
            }

            salesByCategory[categoryId].push({
                'Produkt': sale.name,
                'Preis': sale.price,
                'Zeitpunkt': sale.timestamp,
                'Zahlungsart': sale.paymentMethod || 'bar',
                'Person': sale.personId || '-'
            });

            categoryTotals[categoryId].count++;
            categoryTotals[categoryId].total += sale.price;
        });

        // Übersichts-Tab
        const summaryData = [];
        let grandTotal = 0;
        let grandCount = 0;

        categoriesData.forEach(cat => {
            const totals = categoryTotals[cat.id] || { count: 0, total: 0 };
            summaryData.push({
                'Kategorie': cat.label,
                'Anzahl Verkäufe': totals.count,
                'Umsatz': totals.total.toFixed(2) + ' €'
            });
            grandTotal += totals.total;
            grandCount += totals.count;
        });

        // "Sonstige" Kategorie falls vorhanden
        if (categoryTotals['other']) {
            summaryData.push({
                'Kategorie': 'Sonstige',
                'Anzahl Verkäufe': categoryTotals['other'].count,
                'Umsatz': categoryTotals['other'].total.toFixed(2) + ' €'
            });
            grandTotal += categoryTotals['other'].total;
            grandCount += categoryTotals['other'].count;
        }

        // Gesamtsumme
        summaryData.push({
            'Kategorie': 'GESAMT',
            'Anzahl Verkäufe': grandCount,
            'Umsatz': grandTotal.toFixed(2) + ' €'
        });

        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Übersicht');

        // Ein Tab pro Kategorie
        categoriesData.forEach(cat => {
            const catSales = salesByCategory[cat.id] || [];
            if (catSales.length > 0) {
                const sheet = XLSX.utils.json_to_sheet(catSales);
                // Tabname max 31 Zeichen
                const sheetName = cat.label.substring(0, 31);
                XLSX.utils.book_append_sheet(wb, sheet, sheetName);
            }
        });

        // "Sonstige" Tab falls vorhanden
        if (salesByCategory['other'] && salesByCategory['other'].length > 0) {
            const sheet = XLSX.utils.json_to_sheet(salesByCategory['other']);
            XLSX.utils.book_append_sheet(wb, sheet, 'Sonstige');
        }

        // Download
        const filename = `fos_bar_verkaeufe_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        showToast('Excel-Datei erstellt');

    } catch (error) {
        console.error('Excel-Export-Fehler:', error);
        showToast('Fehler beim Excel-Export', 'error');
    }
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadCSV(csv, filename) {
    // BOM für Excel-Kompatibilität
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function renderManagerStatistik() {
    console.log('Loading Statistik data...');

    // Load sales data from API
    const sales = await loadSalesData();
    const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'today';
    const filteredSales = getFilteredSales(sales, currentFilter);

    // Render statistics
    renderTopSellers(filteredSales);
    renderQuantityChart(filteredSales);
    renderRevenueChart(filteredSales);

    // Add filter button listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderManagerStatistik();
        });
    });
}

async function renderManagerInventar() {
    console.log('Loading Inventar data...');

    // Produkt-Dropdown befüllen
    renderInventoryProductSelect();

    // Load inventory and sales data from API
    const inventory = await loadInventoryData();
    const sales = await loadSalesData();
    const todaySales = getTodaySales(sales);

    // Render inventory table
    renderInventoryTable(inventory, todaySales);
}

function renderInventoryProductSelect() {
    const select = document.getElementById('inventory-product');
    if (!select) return;

    // Produkte nach Kategorie gruppieren
    const productsByCategory = {};
    products.forEach(product => {
        const cat = product.category || 'other';
        if (!productsByCategory[cat]) {
            productsByCategory[cat] = [];
        }
        productsByCategory[cat].push(product);
    });

    // Dropdown befüllen
    select.innerHTML = '<option value="">-- Produkt wählen --</option>';

    Object.keys(productsByCategory).sort().forEach(category => {
        const catLabel = getCategoryLabel(category);
        const optgroup = document.createElement('optgroup');
        optgroup.label = catLabel;

        productsByCategory[category]
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                optgroup.appendChild(option);
            });

        select.appendChild(optgroup);
    });
}

// Helper functions (API-based)
async function loadSalesData() {
    try {
        return await apiGet('sales');
    } catch (error) {
        console.error('Fehler beim Laden der Verkäufe:', error);
        return [];
    }
}

async function loadInventoryData() {
    try {
        return await apiGet('inventory');
    } catch (error) {
        console.error('Fehler beim Laden des Inventars:', error);
        return [];
    }
}

async function handleInventoryFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const productId = formData.get('productId');
    const quantity = parseInt(formData.get('quantity'));

    if (!productId || !quantity || quantity < 1) {
        showToast('Bitte alle Pflichtfelder ausfüllen', 'error');
        return;
    }

    try {
        const entry = {
            productId: productId,
            date: new Date().toISOString().split('T')[0],
            quantity: quantity
        };

        await apiPost('inventory', entry);

        const product = products.find(p => p.id === productId);
        showToast(`${quantity}x ${product?.name || productId} erfasst`);

        e.target.reset();

        // Inventar-Tab neu laden
        await renderManagerInventar();
    } catch (error) {
        console.error('Fehler beim Speichern des Inventars:', error);
        showToast('Fehler beim Speichern', 'error');
    }
}

function getTodaySales(sales) {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(sale => sale.timestamp.startsWith(today));
}

function getFilteredSales(sales, filter) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (filter === 'today') {
        return sales.filter(sale => sale.timestamp.startsWith(today));
    } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sales.filter(sale => new Date(sale.timestamp) >= weekAgo);
    }
    return sales; // 'all'
}

function renderProductBreakdown(sales) {
    const breakdown = document.getElementById('product-breakdown');
    if (!breakdown) return;

    const productStats = {};
    sales.forEach(sale => {
        if (!productStats[sale.name]) {
            productStats[sale.name] = { count: 0, revenue: 0 };
        }
        productStats[sale.name].count++;
        productStats[sale.name].revenue += sale.price;
    });

    breakdown.innerHTML = Object.entries(productStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([name, stats]) => `
            <div class="breakdown-item">
                <span class="product-name">${name}</span>
                <span class="product-stats">${stats.count}x • ${stats.revenue.toFixed(2)}€</span>
            </div>
        `).join('') || '<p class="empty-message">Noch keine Verkäufe heute</p>';
}

function renderTopSellers(sales) {
    const topSellers = document.getElementById('top-sellers');
    if (!topSellers) return;

    const productCounts = {};
    sales.forEach(sale => {
        productCounts[sale.name] = (productCounts[sale.name] || 0) + 1;
    });

    const sorted = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    topSellers.innerHTML = sorted
        .map(([name, count], index) => `
            <div class="ranking-item">
                <span class="rank">${index + 1}</span>
                <span class="name">${name}</span>
                <span class="value">${count}x</span>
            </div>
        `).join('') || '<p class="empty-message">Noch keine Verkäufe</p>';
}

function renderQuantityChart(sales) {
    const chart = document.getElementById('quantity-chart');
    if (!chart) return;

    const productCounts = {};
    sales.forEach(sale => {
        productCounts[sale.name] = (productCounts[sale.name] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(productCounts), 1);

    chart.innerHTML = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => {
            const percentage = (count / maxCount) * 100;
            return `
                <div class="chart-bar">
                    <div class="bar-label">${name}</div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="bar-value">${count}</div>
                </div>
            `;
        }).join('') || '<p class="empty-message">Noch keine Verkäufe</p>';
}

function renderRevenueChart(sales) {
    const chart = document.getElementById('revenue-chart');
    if (!chart) return;

    const productRevenue = {};
    sales.forEach(sale => {
        productRevenue[sale.name] = (productRevenue[sale.name] || 0) + sale.price;
    });

    const maxRevenue = Math.max(...Object.values(productRevenue), 1);

    chart.innerHTML = Object.entries(productRevenue)
        .sort((a, b) => b[1] - a[1])
        .map(([name, revenue]) => {
            const percentage = (revenue / maxRevenue) * 100;
            return `
                <div class="chart-bar">
                    <div class="bar-label">${name}</div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="bar-value">${revenue.toFixed(2)}€</div>
                </div>
            `;
        }).join('') || '<p class="empty-message">Noch keine Verkäufe</p>';
}

function renderInventoryTable(inventory, todaySales) {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    // Products are already loaded from API into global variable

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Keine Produkte verfügbar</td></tr>';
        return;
    }

    // Count sales for each product today
    const salesCount = {};
    todaySales.forEach(sale => {
        salesCount[sale.name] = (salesCount[sale.name] || 0) + 1;
    });

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    tbody.innerHTML = products.map(product => {
        // Find today's inventory entry
        const todayInventory = inventory.find(inv =>
            inv.productId === product.id && inv.date === today
        );

        const incoming = todayInventory?.quantity || 0;
        const sold = salesCount[product.name] || 0;
        const remaining = incoming - sold;

        return `
            <tr>
                <td>${product.name}</td>
                <td>${incoming}</td>
                <td>${sold}</td>
                <td>${remaining}</td>
                <td>-</td>
                <td>-</td>
            </tr>
        `;
    }).join('');
}

// ===========================
// USER MANAGEMENT
// ===========================

async function loadUsers() {
    try {
        users = await apiGet('users');
        console.log('Benutzer aus API geladen:', users.length);
    } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
        users = [];
    }
}

async function renderUsers() {
    const container = document.getElementById('users-list');
    const countEl = document.getElementById('user-count');

    if (!container) return;

    // Load users if not loaded
    if (users.length === 0) {
        await loadUsers();
    }

    if (countEl) countEl.textContent = users.length;

    if (users.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Benutzer vorhanden</p>';
        return;
    }

    const sorted = [...users].sort((a, b) => a.username.localeCompare(b.username));

    container.innerHTML = sorted.map(user => {
        const roleLabel = user.role === 'admin' ? 'Administrator' : 'Mitarbeiter';
        const lastLogin = user.last_login
            ? new Date(user.last_login).toLocaleString('de-DE')
            : 'Noch nie';

        return `
            <div class="user-card ${user.is_active ? '' : 'inactive'}">
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.display_name || user.username)}</div>
                    <div class="user-username">@${escapeHtml(user.username)}</div>
                    <span class="user-role ${user.role}">${roleLabel}</span>
                    <div class="user-last-login">Letzter Login: ${lastLogin}</div>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser('${user.id}')">
                        Bearbeiten
                    </button>
                    <button class="btn-delete" onclick="deleteUser('${user.id}')">
                        Löschen
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function handleUserFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {
        username: formData.get('username').trim(),
        display_name: formData.get('displayName').trim() || undefined,
        role: formData.get('role')
    };

    const password = formData.get('password');

    // Validation
    if (!userData.username) {
        showToast('Bitte Benutzername eingeben', 'error');
        return;
    }

    if (!editingUserId && (!password || password.length < 4)) {
        showToast('Passwort muss mindestens 4 Zeichen haben', 'error');
        return;
    }

    if (password && password.length >= 4) {
        userData.password = password;
    }

    if (editingUserId) {
        updateUser(editingUserId, userData);
    } else {
        createUser(userData);
    }
}

async function createUser(userData) {
    try {
        const result = await apiPost('users', userData);
        users.push(result);
        renderUsers();
        resetUserForm();
        showToast(`Benutzer "${userData.username}" wurde angelegt`, 'success');
    } catch (error) {
        console.error('Fehler beim Anlegen:', error);
        showToast(error.message || 'Fehler beim Anlegen des Benutzers', 'error');
    }
}

async function updateUser(userId, userData) {
    try {
        const response = await fetch(`api/?action=users&id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Fehler beim Aktualisieren');
        }
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = result;
        }
        renderUsers();
        resetUserForm();
        showToast('Benutzer wurde aktualisiert', 'success');
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        showToast(error.message || 'Fehler beim Aktualisieren', 'error');
    }
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);

    if (!user) {
        showToast('Benutzer nicht gefunden', 'error');
        return;
    }

    // Fill form
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-display-name').value = user.display_name || '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = user.role;

    // Update UI
    document.getElementById('user-form-title').textContent = 'Benutzer bearbeiten';
    document.getElementById('btn-user-submit').textContent = 'Benutzer aktualisieren';
    document.getElementById('btn-user-cancel').classList.remove('hidden');
    document.getElementById('user-password').required = false;

    editingUserId = userId;

    // Scroll to form
    document.querySelector('.user-form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteUser(userId) {
    const user = users.find(u => u.id === userId);

    if (!user) {
        showToast('Benutzer nicht gefunden', 'error');
        return;
    }

    confirmAction(
        'Benutzer löschen',
        `Möchten Sie "${user.display_name || user.username}" wirklich löschen?`,
        async () => {
            try {
                const response = await fetch(`api/?action=users&id=${userId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Fehler beim Löschen');
                }
                users = users.filter(u => u.id !== userId);
                renderUsers();
                populateActivityUserFilter();
                showToast('Benutzer wurde gelöscht', 'success');
            } catch (error) {
                console.error('Fehler beim Löschen:', error);
                showToast(error.message || 'Fehler beim Löschen', 'error');
            }
        }
    );
}

function resetUserForm() {
    const form = document.getElementById('user-form');
    if (form) form.reset();

    const title = document.getElementById('user-form-title');
    if (title) title.textContent = 'Neuen Benutzer anlegen';

    const submitBtn = document.getElementById('btn-user-submit');
    if (submitBtn) submitBtn.textContent = 'Benutzer anlegen';

    const cancelBtn = document.getElementById('btn-user-cancel');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    const passwordInput = document.getElementById('user-password');
    if (passwordInput) passwordInput.required = true;

    editingUserId = null;
}

// ===========================
// ACTIVITY LOG
// ===========================

async function loadActivityLog(userId = null) {
    try {
        let url = 'activity_log&limit=50';
        if (userId) {
            url += `&user_id=${userId}`;
        }
        return await apiGet(url);
    } catch (error) {
        console.error('Fehler beim Laden der Aktivitäten:', error);
        return [];
    }
}

async function renderActivityLog() {
    const container = document.getElementById('activity-log');
    const userFilter = document.getElementById('activity-user-filter');

    if (!container) return;

    const selectedUserId = userFilter?.value || null;
    const activities = await loadActivityLog(selectedUserId);

    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Aktivitäten vorhanden</p>';
        return;
    }

    container.innerHTML = activities.map(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString('de-DE');
        const actionLabels = {
            'login': 'Anmeldung',
            'logout': 'Abmeldung',
            'user_created': 'Benutzer erstellt',
            'user_updated': 'Benutzer aktualisiert',
            'user_deleted': 'Benutzer gelöscht',
            'setting_changed': 'Einstellung geändert',
            'preorder_status_changed': 'Bestellstatus geändert'
        };

        const actionLabel = actionLabels[activity.action] || activity.action;
        let details = '';
        if (activity.details) {
            try {
                const detailsObj = typeof activity.details === 'string'
                    ? JSON.parse(activity.details)
                    : activity.details;
                if (detailsObj.ip) details = ` (IP: ${detailsObj.ip})`;
                if (detailsObj.target_user) details = ` (Ziel: ${detailsObj.target_user})`;
                if (detailsObj.key) details = ` (${detailsObj.key})`;
            } catch (e) {}
        }

        return `
            <div class="activity-item">
                <div class="activity-time">${timestamp}</div>
                <div class="activity-user">${escapeHtml(activity.username || 'System')}</div>
                <div class="activity-action">${actionLabel}${details}</div>
            </div>
        `;
    }).join('');
}

async function populateActivityUserFilter() {
    const filter = document.getElementById('activity-user-filter');
    if (!filter) return;

    // Keep current selection
    const currentValue = filter.value;

    filter.innerHTML = '<option value="">Alle Benutzer</option>';

    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.display_name || user.username;
        filter.appendChild(option);
    });

    // Restore selection
    if (currentValue) filter.value = currentValue;
}

async function renderManagerBenutzer() {
    console.log('Loading Benutzer data...');

    // Load users if needed
    await loadUsers();

    // Render components
    renderUsers();
    populateActivityUserFilter();
    renderActivityLog();
}

// ===========================
// PREORDER MANAGEMENT
// ===========================

let preorderSettings = {
    enabled: false,
    start_time: '08:00',
    end_time: '10:00'
};
let preorderProducts = {};
let preorders = [];

async function loadPreorderSettings() {
    try {
        const result = await apiGet('settings&key=preorder_settings');
        if (result.value) {
            preorderSettings = result.value;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Vorbestellungs-Einstellungen:', error);
    }
}

async function savePreorderSettings() {
    try {
        await apiPost('settings', {
            key: 'preorder_settings',
            value: preorderSettings
        });
        showToast('Einstellungen gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showToast('Fehler beim Speichern', 'error');
    }
}

async function loadPreorderProducts() {
    try {
        preorderProducts = await apiGet('preorder_products');
    } catch (error) {
        console.error('Fehler beim Laden der Vorbestellungs-Produkte:', error);
        preorderProducts = {};
    }
}

async function loadPreorders(status = null) {
    try {
        let url = 'preorders';
        if (status) {
            url += `&status=${status}`;
        }
        preorders = await apiGet(url);
    } catch (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
        preorders = [];
    }
}

function renderPreorderSettings() {
    const enabledCheckbox = document.getElementById('preorder-enabled');
    const startTimeInput = document.getElementById('preorder-start-time');
    const endTimeInput = document.getElementById('preorder-end-time');

    if (enabledCheckbox) enabledCheckbox.checked = preorderSettings.enabled || false;
    if (startTimeInput) startTimeInput.value = preorderSettings.start_time || '08:00';
    if (endTimeInput) endTimeInput.value = preorderSettings.end_time || '10:00';
}

function renderPreorderProductsList() {
    const container = document.getElementById('preorder-products-list');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Produkte verfügbar</p>';
        return;
    }

    // Group by category
    const byCategory = {};
    products.forEach(product => {
        const cat = product.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(product);
    });

    let html = '';
    Object.keys(byCategory).sort().forEach(category => {
        const catLabel = getCategoryLabel(category);
        html += `<div class="preorder-category"><h4>${escapeHtml(catLabel)}</h4>`;

        byCategory[category].sort((a, b) => a.name.localeCompare(b.name)).forEach(product => {
            const config = preorderProducts[product.id] || { isAvailable: false, maxQuantity: 10 };
            html += `
                <div class="preorder-product-item ${config.isAvailable ? 'active' : ''}">
                    <div class="product-info">
                        <span class="product-name">${escapeHtml(product.name)}</span>
                        <span class="product-price">${formatPrice(product.price)}</span>
                    </div>
                    <div class="preorder-product-controls">
                        <label class="checkbox-label">
                            <input type="checkbox" ${config.isAvailable ? 'checked' : ''}
                                   onchange="togglePreorderProduct('${product.id}', this.checked)">
                            <span>Verfügbar</span>
                        </label>
                        <div class="max-qty-control">
                            <label>Max:</label>
                            <input type="number" min="1" max="100" value="${config.maxQuantity}"
                                   onchange="updatePreorderMaxQty('${product.id}', this.value)"
                                   style="width: 60px;" ${!config.isAvailable ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    container.innerHTML = html;
}

async function togglePreorderProduct(productId, isAvailable) {
    const config = preorderProducts[productId] || { maxQuantity: 10 };

    try {
        await apiPost('preorder_products', {
            productId: productId,
            isAvailable: isAvailable,
            maxQuantity: config.maxQuantity
        });

        preorderProducts[productId] = {
            isAvailable: isAvailable,
            maxQuantity: config.maxQuantity
        };

        renderPreorderProductsList();
        showToast(isAvailable ? 'Produkt freigegeben' : 'Produkt gesperrt');
    } catch (error) {
        console.error('Fehler:', error);
        showToast('Fehler beim Speichern', 'error');
    }
}

async function updatePreorderMaxQty(productId, maxQuantity) {
    const config = preorderProducts[productId] || { isAvailable: true };
    const qty = parseInt(maxQuantity) || 10;

    try {
        await apiPost('preorder_products', {
            productId: productId,
            isAvailable: config.isAvailable,
            maxQuantity: qty
        });

        preorderProducts[productId] = {
            isAvailable: config.isAvailable,
            maxQuantity: qty
        };
    } catch (error) {
        console.error('Fehler:', error);
        showToast('Fehler beim Speichern', 'error');
    }
}

function renderPreordersList() {
    const container = document.getElementById('preorder-orders-list');
    if (!container) return;

    if (preorders.length === 0) {
        container.innerHTML = '<p class="empty-message">Keine Bestellungen vorhanden</p>';
        return;
    }

    const statusLabels = {
        'pending': 'Offen',
        'completed': 'Abgeholt',
        'cancelled': 'Storniert'
    };

    const statusColors = {
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
    };

    container.innerHTML = preorders.map(order => {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const timestamp = new Date(order.created_at).toLocaleString('de-DE');

        return `
            <div class="preorder-order-card ${order.status}">
                <div class="order-header">
                    <div class="order-customer">${escapeHtml(order.customer_name)}</div>
                    <span class="order-status ${statusColors[order.status]}">${statusLabels[order.status]}</span>
                </div>
                <div class="order-time">${timestamp}</div>
                <div class="order-items">
                    ${items.map(item => `
                        <div class="order-item">
                            <span>${item.quantity}x ${escapeHtml(item.productName)}</span>
                            <span>${formatPrice(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <strong>Gesamt: ${formatPrice(total)}</strong>
                </div>
                ${order.status === 'pending' ? `
                    <div class="order-actions">
                        <button class="btn-small btn-primary" onclick="updatePreorderStatus('${order.id}', 'completed')">
                            Als abgeholt markieren
                        </button>
                        <button class="btn-small btn-secondary" onclick="updatePreorderStatus('${order.id}', 'cancelled')">
                            Stornieren
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function updatePreorderStatus(orderId, status) {
    try {
        const response = await fetch(`api/?action=preorders&id=${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Fehler beim Aktualisieren');
        }
        showToast('Status aktualisiert');

        // Reload
        const filterValue = document.getElementById('preorder-status-filter')?.value || '';
        await loadPreorders(filterValue || null);
        renderPreordersList();
    } catch (error) {
        console.error('Fehler:', error);
        showToast('Fehler beim Aktualisieren', 'error');
    }
}

async function renderManagerVorbestellung() {
    console.log('Loading Vorbestellung data...');

    // Load all data
    await Promise.all([
        loadPreorderSettings(),
        loadPreorderProducts(),
        loadPreorders('pending')
    ]);

    // Render components
    renderPreorderSettings();
    renderPreorderProductsList();
    renderPreordersList();
}

// ===========================
// EXPOSE FOR INLINE HANDLERS
// ===========================

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editLoyaltyCardType = editLoyaltyCardType;
window.deleteLoyaltyCardType = deleteLoyaltyCardType;
window.toggleLoyaltyCardTypeActive = toggleLoyaltyCardTypeActive;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.togglePreorderProduct = togglePreorderProduct;
window.updatePreorderMaxQty = updatePreorderMaxQty;
window.updatePreorderStatus = updatePreorderStatus;
