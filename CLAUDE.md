# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FOS Bar is a German-language point-of-sale (POS) system for a school bar, built as a client-side web application using vanilla JavaScript, HTML, and CSS. All data is stored in browser localStorage with JSON export/import functionality for backup and data migration.

## Architecture

### Two-Page Application Structure

**index.html** - Main sales interface with 3 tabs:
- **Verkauf (Sales)**: Product grid for quick sales, daily sales list
- **Gutschriften (Credits)**: Customer credit management with balance tracking and loyalty cards
- **Schuldbuch (Debt Book)**: Debt tracking system for customers who buy on credit

**manager.html** - Administrative interface with 4 tabs:
- **Verwaltung (Management)**: Product, category, and loyalty card type management
- **Bilanz (Balance)**: Today's sales summary and breakdown
- **Statistik (Statistics)**: Sales analytics with charts and top sellers
- **Inventar (Inventory)**: Stock tracking and predictions

### Key JavaScript Files

**app.js** (~2800 lines) - Core application logic:
- State management for products, sales, persons, debtors, categories, loyalty cards, inventory
- Data persistence via localStorage with fallback to JSON files
- Sales processing with multiple payment methods (cash, credit, loyalty stamps)
- Loyalty card system with two types: "buy N get 1" and "pay N get M"
- Export/import functionality for all data types
- Rendering functions for all UI components

**manager.js** (~1300 lines) - Administrative functionality:
- Product CRUD operations with categories and sort order
- Category management (create, edit, delete)
- Loyalty card type creation with flexible binding (product, multiple products, or category)
- Tab-specific rendering for Bilanz, Statistik, and Inventar
- Synchronized storage with app.js via shared localStorage keys

### Data Storage Strategy

**localStorage Keys:**
- `fos_bar_products` - Product catalog (managed in manager, loaded in app)
- `fos_bar_categories` - Category definitions with id and label
- `fos_bar_sales` - All sales transactions
- `fos_bar_persons` - Customer credit accounts with loyalty cards
- `fos_bar_debtors_index` - Index of debt records
- `fos_bar_debtors_{id}` - Individual debt records (separated for performance)
- `fos_bar_loyalty_card_types` - Loyalty card type definitions
- `fos_bar_inventory` - Stock entries

**Schuldbuch Separate Storage:**
Each debtor is stored in a separate localStorage entry (`fos_bar_debtors_{id}`) with an index file for performance. This allows individual JSON export per debtor.

### Critical Code Patterns

**Element Existence Checks:**
Always check if elements exist before accessing them, as manager.html and index.html have different DOM structures:
```javascript
const element = document.getElementById('element-id');
if (!element) return; // Element not on this page
```

**Event Listener Attachment:**
Functions must be exposed globally for inline onclick handlers:
```javascript
window.functionName = functionName;
```

**Loyalty Card System:**
- Cards are attached to persons via `person.loyaltyCards` array
- Each card tracks `currentStamps`, `completedCards`, and `history`
- When a card is completed and redeemed, it is automatically deleted
- Cards can be bound to: single product, multiple products, or category
- Two card types: "buy_n_get_1" (N purchases → 1 free) or "pay_n_get_m" (pay N → get M)

**Category System:**
- Categories are loaded from localStorage with fallback to defaults
- Categories have `id` (slug) and `label` (display name)
- Always use `getCategoryLabel(categoryId)` to get display names
- Product rendering dynamically builds category headers from the categories array

### Common Issues & Solutions

**Browser Caching:**
Both HTML files include cache-busting version parameters on CSS/JS includes:
```html
<link rel="stylesheet" href="styles.css?v=1768216614788">
```
Update the version number when making significant changes.

**Tab Switching:**
Both files have inline fallback tab switching scripts at the end of the HTML. This ensures tabs work even if the main JavaScript fails to load.

**Form Submissions:**
All forms use `e.preventDefault()` to prevent page navigation. Forms must have event listeners attached in `initEventListeners()`.

**Checkbox Defaults:**
Filter checkboxes default to checked (showing all data):
- "Mit 0€ anzeigen" in Verkauf and Gutschriften tabs
- "Beglichene anzeigen" in Schuldbuch tab
Corresponding JavaScript state variables are initialized to `true`.

## Development Workflow

**Testing Changes:**
1. Open both index.html and manager.html in browser
2. Use hard refresh (Ctrl+Shift+R or Ctrl+F5) to clear cache
3. Check browser console for errors
4. Test data flow between pages (e.g., create product in manager, see it in sales)

**Syntax Validation:**
```bash
node -c app.js
node -c manager.js
```

**Data Export/Import:**
Use the built-in export buttons to backup data before testing destructive changes. Import functions have confirmation dialogs and error handling.

## File Relationships

```
index.html → app.js → localStorage ← manager.js ← manager.html
           ↓
       styles.css

manager.html also includes manager.css for admin-specific styles
```

Both pages share:
- `fos_bar_products` (products)
- `fos_bar_categories` (category definitions)
- `fos_bar_loyalty_card_types` (loyalty card configurations)
- `fos_bar_sales` (sales data for Bilanz/Statistik)

## Important Constraints

- No build system - direct HTML/JS/CSS files
- No dependencies - vanilla JavaScript only
- German language throughout (variable names, UI text, comments)
- Browser localStorage has size limits (~5-10MB depending on browser)
- Loyalty cards auto-delete after redemption (not reset)
- All monetary values use German decimal format (comma separator) for display
- Export/import operations overwrite existing data (with confirmation)
