// ===========================
// STATE & STORAGE
// ===========================

let products = [];
let loyaltyCardTypes = [];
let categories = [];
let editingProductId = null;
let editingCardTypeId = null;
let editingCategoryId = null;
let currentCategoryFilter = 'all';

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

    // Export/Import
    document.getElementById('btn-export').addEventListener('click', exportProducts);
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', importProducts);

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
        description: formData.get('description').trim() || undefined
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
        label: formData.get('label').trim()
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
        label: categoryData.label
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

        return `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-name">${escapeHtml(category.label)}</div>
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
    }
}

// Bilanz/Statistik/Inventar Funktionen (laden Daten via API)

async function renderManagerBilanz() {
    console.log('Loading Bilanz data...');

    // Load sales data from API
    const sales = await loadSalesData();
    const todaySales = getTodaySales(sales);

    // Update summary
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.price, 0);
    const totalCount = todaySales.length;

    const bilanzTotal = document.getElementById('bilanz-total');
    const bilanzCount = document.getElementById('bilanz-count');

    if (bilanzTotal) bilanzTotal.textContent = totalRevenue.toFixed(2) + '€';
    if (bilanzCount) bilanzCount.textContent = totalCount;

    // Render product breakdown
    renderProductBreakdown(todaySales);
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
// EXPOSE FOR INLINE HANDLERS
// ===========================

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editLoyaltyCardType = editLoyaltyCardType;
window.deleteLoyaltyCardType = deleteLoyaltyCardType;
window.toggleLoyaltyCardTypeActive = toggleLoyaltyCardTypeActive;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
