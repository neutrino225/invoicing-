# Invoice Template System — Integration Guide

This guide covers how to integrate the invoice **template editor** (creation) and **invoice generator** (rendering) into your existing application.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Prerequisites & Dependencies](#prerequisites--dependencies)
4. [Files to Copy](#files-to-copy)
5. [Database Setup](#database-setup)
6. [Backend API Requirements](#backend-api-requirements)
7. [Frontend Integration](#frontend-integration)
   - [Step 1: Install Dependencies](#step-1-install-dependencies)
   - [Step 2: Copy Source Files](#step-2-copy-source-files)
   - [Step 3: Update the API Layer](#step-3-update-the-api-layer)
   - [Step 4: Add Routes](#step-4-add-routes)
   - [Step 5: Include Styles](#step-5-include-styles)
8. [How the Two Features Work](#how-the-two-features-work)
   - [Template Editor (Creation)](#template-editor-creation)
   - [Invoice Generator (Rendering)](#invoice-generator-rendering)
9. [Data Flow — End to End](#data-flow--end-to-end)
10. [File-by-File Reference](#file-by-file-reference)
11. [Customization & Configuration](#customization--configuration)
12. [Discount Fields](#discount-fields)
13. [Employee-Specific Templates](#employee-specific-templates)
14. [Troubleshooting](#troubleshooting)

---

## System Overview

The system has **two main features**:

| Feature | Component | Route (example) | Purpose |
|---------|-----------|------------------|---------|
| **Template Editor** | `InvoiceTemplateCreator` | `/invoice/template-editor` | Visual drag-and-drop editor to design invoice layouts |
| **Invoice Generator** | `InvoiceGenerator` | `/invoice/generate` | Select a saved template + order ID → rendered printable invoice |

Both features share utility files for HTML generation, data transformation, and API communication.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR EXISTING APP                       │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────────────────┐ │
│  │  Template Editor  │      │     Invoice Generator        │ │
│  │  (invoiceGenerator│      │  (components/InvoiceGenerator│ │
│  │   .jsx)           │      │   .jsx)                      │ │
│  └────────┬─────────┘      └──────────┬───────────────────┘ │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Shared Utilities (src/utils/)               │ │
│  │  • templateHtmlGenerator.js  — Generate HTML + mappings  │ │
│  │  • templateSerializer.js     — Serialize/deserialize     │ │
│  │  • dataTransformer.js        — API data → template data  │ │
│  │  • invoiceDataMapper.js      — API response → structure  │ │
│  │  • templateEngine.js         — Render [PLACEHOLDER] HTML │ │
│  │  • mustacheFixer.js          — Fix legacy Mustache syntax│ │
│  └────────────────────────┬────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 API Layer (src/api/)                      │ │
│  │  • templateApi.js — CRUD for templates                   │ │
│  │  • invoiceApi.js  — Fetch order/invoice data             │ │
│  └────────────────────────┬────────────────────────────────┘ │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │  HTTP (axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     YOUR BACKEND API                         │
│                                                              │
│  Templates CRUD:                                             │
│    GET    /templates              — List templates            │
│    GET    /templates/:id          — Get single template       │
│    POST   /templates              — Create template           │
│    PUT    /templates/:id          — Update template           │
│    DELETE /templates/:id          — Delete template           │
│    POST   /templates/:id/set-default — Set default template   │
│                                                              │
│  Invoice Data:                                               │
│    GET    /operation/get-order-invoice-data?orderId=X         │
│                                                              │
│  Database Tables:                                            │
│    • templates                                               │
│    • template_mappings                                       │
│    • template_aggregations                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites & Dependencies

### NPM Packages Required

Add these to your existing `package.json`:

```bash
npm install axios lucide-react mustache react-router-dom
```

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.13 | HTTP client for API calls |
| `lucide-react` | ^0.562 | Icons (Edit, Save, Printer, etc.) |
| `mustache` | ^4.2 | Template rendering (used in HTML generation) |
| `react-router-dom` | ^7.12 | Routing (only if not already installed) |

> **Note:** If your app already has `axios` and `react-router-dom`, you don't need to install them again. Just add `lucide-react` and `mustache`.

---

## Files to Copy

Copy these files into your existing project. The paths below are relative to `src/`:

### Core Components (2 files)

| Source File | Purpose | Required For |
|-------------|---------|--------------|
| `src/invoiceGenerator.jsx` | **Template Editor** — full visual editor with live preview | Template creation |
| `src/components/InvoiceGenerator.jsx` | **Invoice Generator** — select template + order ID → rendered invoice | Invoice generation |

### Supporting Components (2 files)

| Source File | Purpose |
|-------------|---------|
| `src/components/TemplateSaveDialog.jsx` | Modal dialog for naming/saving templates |
| `src/components/TemplateManager.jsx` | Modal for listing, deleting, setting default templates |

### Utility Files (6 files)

| Source File | Purpose |
|-------------|---------|
| `src/utils/templateHtmlGenerator.js` | Generates HTML string with `[PLACEHOLDER]` syntax from template state. Also generates `mappings` and `aggregations` arrays. |
| `src/utils/templateSerializer.js` | Serializes/deserializes template state to/from JSON for database storage |
| `src/utils/dataTransformer.js` | Transforms raw API data into the structure the HTML template expects, using mappings and aggregations |
| `src/utils/invoiceDataMapper.js` | Maps raw API response into a structured object for the template editor's live preview |
| `src/utils/templateEngine.js` | Pure JS template engine that replaces `[PLACEHOLDER]` syntax with real data. Handles loops, conditionals, nested fields |
| `src/utils/mustacheFixer.js` | Fixes legacy Mustache syntax issues (`{{#each}}` → `{{#array}}`) |

### API Layer (2 files)

| Source File | Purpose |
|-------------|---------|
| `src/api/templateApi.js` | All template CRUD operations (fetch, create, update, delete, set-default) |
| `src/api/invoiceApi.js` | Fetches invoice/order data from your backend |

### Styles (1 file)

| Source File | Purpose |
|-------------|---------|
| `src/invoiceGenerator.css` | All CSS for the template editor, invoice preview, print styles, and UI controls |

### Summary: 13 files total

```
src/
├── api/
│   ├── invoiceApi.js          ← API: fetch order data
│   └── templateApi.js         ← API: template CRUD
├── components/
│   ├── InvoiceGenerator.jsx   ← Feature: Generate invoices
│   ├── TemplateManager.jsx    ← UI: Manage saved templates
│   └── TemplateSaveDialog.jsx ← UI: Save template dialog
├── utils/
│   ├── dataTransformer.js     ← Transform API data → template data
│   ├── invoiceDataMapper.js   ← Map API response → structured object
│   ├── mustacheFixer.js       ← Fix legacy syntax
│   ├── templateEngine.js      ← Render [PLACEHOLDER] → real values
│   ├── templateHtmlGenerator.js ← Generate HTML from template state
│   └── templateSerializer.js  ← Serialize/deserialize template config
├── invoiceGenerator.jsx       ← Feature: Template Editor
└── invoiceGenerator.css       ← All styles
```

---

## Database Setup

You need **3 tables** (plus an optional migration for employee-specific templates). Run these SQL migrations in order:

### Migration 1: `templates` table

```sql
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    html TEXT NOT NULL,
    template_config JSON,
    is_default BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1,
    status ENUM('active', 'draft', 'archived') DEFAULT 'active',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_default (is_default),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migration 2: `template_mappings` table

```sql
CREATE TABLE IF NOT EXISTS template_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    section VARCHAR(50) NOT NULL,
    template_field VARCHAR(100) NOT NULL,
    api_field_path VARCHAR(255) NOT NULL,
    custom_label VARCHAR(255),
    field_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_id (template_id),
    INDEX idx_section (section),
    INDEX idx_template_section_order (template_id, section, field_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migration 3: `template_aggregations` table

```sql
CREATE TABLE IF NOT EXISTS template_aggregations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    aggregation_id VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    fields JSON NOT NULL,
    type ENUM('add', 'replace') NOT NULL DEFAULT 'add',
    field_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_id (template_id),
    INDEX idx_aggregation_id (aggregation_id),
    INDEX idx_template_order (template_id, field_order),
    UNIQUE KEY unique_template_aggregation (template_id, aggregation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migration 4: Composite indexes (optional performance)

```sql
CREATE INDEX idx_status_default ON templates(status, is_default);
CREATE INDEX idx_template_section ON template_mappings(template_id, section);
```

### Migration 5: Employee-specific templates (optional)

```sql
ALTER TABLE templates
    ADD COLUMN employee_id INT NULL AFTER id,
    ADD INDEX idx_employee_id (employee_id),
    ADD INDEX idx_employee_status (employee_id, status);
```

---

## Backend API Requirements

Your backend must implement the following endpoints. See `BACKEND_API_GUIDE.md` for full request/response specifications.

### Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/templates` | List all templates (optionally filtered by `?employee_id=X`) |
| `GET` | `/templates/:id` | Get a single template with its mappings and aggregations |
| `POST` | `/templates` | Create a new template |
| `PUT` | `/templates/:id` | Update an existing template |
| `DELETE` | `/templates/:id` | Delete a template |
| `POST` | `/templates/:id/set-default` | Set a template as default |

### Invoice Data Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/operation/get-order-invoice-data` | Fetch order data by `?orderId=X&baseurl=Y` |

---

## Frontend Integration

### Step 1: Install Dependencies

```bash
npm install lucide-react mustache
# If not already installed:
npm install axios react-router-dom
```

### Step 2: Copy Source Files

Copy all 13 files listed in [Files to Copy](#files-to-copy) into your project, maintaining the same folder structure relative to your `src/` directory.

If your project uses a different folder structure, just update the import paths accordingly.

### Step 3: Update the API Layer

Open `src/api/templateApi.js` and update these values:

```javascript
// 1. Update API_BASE_URL to your backend
const API_BASE_URL = "https://your-backend.com/api";

// 2. Update how the access token is obtained
// OPTION A: Read from your auth context/store
const ACCESS_TOKEN = getTokenFromYourAuthSystem();

// OPTION B: Read from localStorage
const ACCESS_TOKEN = localStorage.getItem("accessToken");

// 3. Update the route prefix (currently "/kolsontest/templates")
// Change all occurrences of "/kolsontest/templates" to match your backend:
apiClient.get("/your-prefix/templates")

// 4. Update getEmployeeId() to read from your auth system
export const getEmployeeId = () => {
    // Option A: Decode JWT
    const decoded = decodeJWT(ACCESS_TOKEN);
    return decoded?.user_id;

    // Option B: Read from your user context/store
    return currentUser.employeeId;
};
```

Open `src/api/invoiceApi.js` and update:

```javascript
// 1. Update the endpoint URL
const response = await axios.get(
    `https://your-backend.com/api/operation/get-order-invoice-data`,
    // ...
);

// 2. Update how the access token is obtained
const ACCESS_TOKEN = getTokenFromYourAuthSystem();
```

### Step 4: Add Routes

In your existing router/app, add two new routes:

```jsx
import InvoiceTemplateCreator from './invoiceGenerator';
import InvoiceGenerator from './components/InvoiceGenerator';

// In your router:
<Route path="/invoice/template-editor" element={<InvoiceTemplateCreator />} />
<Route path="/invoice/generate" element={<InvoiceGenerator />} />
```

If you only want **one** of the features:
- **Template Editor only**: Import just `invoiceGenerator.jsx`
- **Invoice Generator only**: Import just `components/InvoiceGenerator.jsx`

### Step 5: Include Styles

Import the CSS file in your main entry point or in the components that use it:

```javascript
// In your main App.jsx or index.jsx
import './invoiceGenerator.css';
```

> **Important:** The CSS uses specific class names (prefixed with `invoice-`) that shouldn't conflict with most projects. However, review the global styles at the top of `invoiceGenerator.css` (input/checkbox styles) and scope them if they conflict with your existing styles.

---

## How the Two Features Work

### Template Editor (Creation)

**File:** `src/invoiceGenerator.jsx` (component: `InvoiceTemplateCreator`)

This is a visual editor with a left panel for configuration and a right panel for live preview.

**What the user does:**
1. Toggle fields on/off (header, line items, summary, footer)
2. Reorder fields with up/down arrows
3. Rename column headers by clicking on them
4. Create aggregated columns (e.g., combine `firstDisc + secondDisc` into "Total Discount")
5. Configure paper size (A4, A5, Letter), font size, table borders
6. Add custom footer text rows
7. Click "Save Template"

**What happens on save:**
1. `generateTemplateHtml()` converts the template state into an HTML string with `[PLACEHOLDER]` syntax
2. `generateMappings()` creates an array of objects mapping template fields to API paths
3. `generateAggregations()` creates aggregation definitions
4. `serializeTemplateState()` serializes the full UI state as JSON
5. All of this is sent to `POST /templates` with this body:

```json
{
    "name": "My Invoice Template",
    "description": "...",
    "html": "<html>...[header.companyName]...[#lineItems]...[/lineItems]...</html>",
    "template_config": {
        "header": { "topRow": [...], "left": [...], "right": [...] },
        "lineItems": ["sku", "ctn", "pcs", ...],
        "summary": ["totalQty", "tpValue", ...],
        "fontSize": 9,
        "paperSize": "A4",
        "aggregations": [...],
        "footer": [...],
        ...
    },
    "is_default": false,
    "employee_id": 2821,
    "mappings": [
        { "section": "header", "template_field": "companyName", "api_field_path": "distributor.name", ... },
        { "section": "lineItems", "template_field": "sku", "api_field_path": "itemName", ... },
        ...
    ],
    "aggregations": [
        { "aggregation_id": "agg_123", "label": "Total Discount", "fields": ["firstDisc", "secondDisc"], "type": "replace" }
    ]
}
```

### Invoice Generator (Rendering)

**File:** `src/components/InvoiceGenerator.jsx`

This component takes a saved template and real order data, then renders a printable invoice.

**What the user does:**
1. Select a template from the dropdown
2. Enter an order ID
3. Click "Generate Invoice"
4. Print or export

**What happens on generate:**
1. `fetchTemplate(id)` — fetches the template with its HTML, mappings, and aggregations
2. `fetchInvoiceData(orderId)` — fetches real order data from your API
3. `transformApiDataToTemplate(apiData, mappings, aggregations)` — transforms the raw API data into the structure the HTML template expects
4. `convertMustacheToPlaceholder(html)` — normalizes `{{field}}` → `[field]` syntax
5. `renderTemplate(html, data)` — replaces all `[PLACEHOLDER]`s with real values, processes loops and conditionals
6. The final HTML is rendered via `dangerouslySetInnerHTML`

---

## Data Flow — End to End

### Creating a Template

```
User configures template in editor
        │
        ▼
Template state (React useState)
        │
        ▼
┌───────────────────────────────────┐
│  generateTemplateHtml()           │ → HTML with [PLACEHOLDER] syntax
│  generateMappings()               │ → Array of field mappings
│  generateAggregations()           │ → Array of aggregation configs
│  serializeTemplateState()         │ → JSON config for restoring UI state
└───────────────────────────────────┘
        │
        ▼
POST /templates  →  Backend saves to DB
```

### Generating an Invoice

```
User selects template + enters order ID
        │
        ▼
┌───────────────────────────────────┐
│  fetchTemplate(id)                │ → { html, mappings, aggregations, template_config }
│  fetchInvoiceData(orderId)        │ → { invoiceId, distributor, customer, items, totals, ... }
└───────────────────────────────────┘
        │
        ▼
transformApiDataToTemplate(apiData, mappings, aggregations)
        │
        ▼
Produces: { header: {...}, lineItems: [...], summary: {...}, notes: {...}, dates: {...} }
        │
        ▼
renderTemplate(html, transformedData)
        │
        ▼
Final HTML string with all data filled in
        │
        ▼
Displayed via dangerouslySetInnerHTML → User prints
```

---

## File-by-File Reference

### `src/invoiceGenerator.jsx`
**The Template Editor.** This is a large (~2500 lines) React component that provides:
- A sidebar panel with collapsible sections for header, line items, summary, footer
- Field toggles (checkboxes) to show/hide columns
- Drag to reorder columns
- Inline click-to-rename column headers
- Aggregation creation modal (combine multiple columns into one)
- Paper size selector, font size slider, border toggle
- Live invoice preview on the right side
- Save/Load templates via API

**Key state:**
```javascript
const [template, setTemplate] = useState({
    header: { topRow: [...], left: [...], right: [...] },
    lineItems: ["sku", "ctn", "pcs", "rp", "tp", "tpVal", ...],
    summary: ["totalQty", "tpValue", ...],
    showCtSize: true,
    showBarcode: false,
    showHsCode: false,
    summaryLayout: "split",
    fontSize: 9,
    showTableBorders: false,
    columnLabels: {},        // Custom column name overrides
    aggregations: [],        // Combined columns
    footer: [],              // Custom footer text rows
});
```

### `src/components/InvoiceGenerator.jsx`
**The Invoice Generator.** Simpler component (~460 lines):
- Template dropdown (auto-selects default)
- Order ID input
- Base URL input (optional)
- Generate button
- Print / Export PDF buttons
- Rendered invoice display

### `src/utils/templateHtmlGenerator.js`
**Generates HTML from template state.** Key exports:
- `generateTemplateHtml(templateState, invoiceData, paperSize, columnWidths)` → HTML string
- `generateMappings(templateState)` → `[{ section, template_field, api_field_path, ... }]`
- `generateAggregations(templateState)` → `[{ aggregation_id, label, fields, type }]`

This file also handles:
- Column width calculation (adaptive to paper size and font size)
- Inline CSS generation for the standalone HTML template
- Header, line items table, summary, and footer HTML generation

### `src/utils/dataTransformer.js`
**Transforms API data for rendering.** Key export:
- `transformApiDataToTemplate(apiData, mappings, aggregations)` → `{ header, lineItems, summary, notes, dates }`

This is the bridge between your API response format and what the template HTML expects. It:
- Uses the `mappings` array to read values from the correct API paths
- Applies aggregations (sums specified fields into a single column)
- Handles special fields like dates, discount calculations, GST, etc.

### `src/utils/invoiceDataMapper.js`
**Maps API response for the editor's live preview.** Key export:
- `mapApiDataToInvoice(apiData)` → structured object matching `PLACEHOLDER_DATA`

Used by the **Template Editor** only. The **Invoice Generator** uses `dataTransformer.js` instead.

### `src/utils/templateEngine.js`
**Pure JS template engine.** Key exports:
- `renderTemplate(template, data)` → rendered HTML string
- `convertMustacheToPlaceholder(html)` → converts `{{field}}` → `[field]`

Supports:
- Simple placeholders: `[fieldName]`
- Nested: `[header.customerName]`
- Loops: `[#lineItems]...[/lineItems]`
- Conditionals: `[#if field]...[/if]`
- Index: `[_index]`

### `src/utils/templateSerializer.js`
**Serialize/deserialize template config.** Key exports:
- `serializeTemplateState(state)` → JSON-safe object
- `deserializeTemplateState(config)` → full state with defaults

Used when saving to and loading from the database.

### `src/utils/mustacheFixer.js`
**Fixes legacy Mustache syntax.** Converts `{{#each array}}` → `{{#array}}` and `{{/each}}` → `{{/array}}`.

### `src/api/templateApi.js`
**Template CRUD.** All API calls for templates. Key exports:
- `fetchTemplates()` — list all templates (filtered by employee_id)
- `fetchTemplate(id)` — get one template with mappings + aggregations
- `createTemplate(data)` — create new template
- `updateTemplate(id, data)` — update existing
- `deleteTemplate(id)` — delete
- `setDefaultTemplate(id)` — set as default
- `getEmployeeId()` — returns the current user's employee ID

### `src/api/invoiceApi.js`
**Invoice data fetcher.** Key export:
- `fetchInvoiceData(orderId, baseUrl)` — fetches order/invoice data from your API

### `src/invoiceGenerator.css`
**All styles.** Includes:
- Editor panel layout (sidebar + preview)
- Field item styles (checkboxes, labels, controls)
- Invoice paper styles (A4, A5, Letter)
- Table, header, summary, footer styles
- Print-specific `@media print` rules
- Spinner animation

---

## Customization & Configuration

### Adding New Fields

To add a new field to line items:

1. **`invoiceGenerator.jsx`**: Add to `PLACEHOLDER_DATA.lineItems`, `AVAILABLE_FIELDS.lineItems`, `COLUMN_TYPES.NUMBER` (if numeric), and the default `template.lineItems` state.

2. **`templateHtmlGenerator.js`**: Add to `COLUMN_TYPES.NUMBER` array, `getFieldLabel()` labels, `getFieldType()`, and `lineItemMappings`.

3. **`dataTransformer.js`**: Add mapping logic in the `lineItems` processing section and update `numericFields` if applicable.

4. **`invoiceDataMapper.js`**: Add to the `lineItems` map function.

5. **`templateSerializer.js`**: Add to the default `lineItems` array in `deserializeTemplateState`.

### Changing the API Response Format

If your API returns data in a different structure, you need to update:

1. **`src/api/invoiceApi.js`**: Adjust how the response is read
2. **`src/utils/invoiceDataMapper.js`**: Update the mapping logic
3. **`src/utils/templateHtmlGenerator.js`**: Update `lineItemMappings` and `headerMappings` to match your API paths
4. **`src/utils/dataTransformer.js`**: Update `getNestedValue` paths

### Changing the Theme/Colors

The primary color is `#21b464` (green). Search and replace in:
- `invoiceGenerator.css` (`.save-button`, `.toolbar-button-print`)
- `invoiceGenerator.jsx` (inline styles)
- `components/InvoiceGenerator.jsx` (inline styles)

---

## Discount Fields

The system supports **4 individual discount fields**:

| Field ID | Default Label | API Path |
|----------|---------------|----------|
| `firstDisc` | First Disc | `pricing.discounts.firstDisc` |
| `secondDisc` | Second Disc | `pricing.discounts.secondDisc` |
| `thirdDisc` | Third Disc | `pricing.discounts.thirdDisc` |
| `fourthDisc` | Fourth Disc | `pricing.discounts.fourthDisc` |

Users can:
- Toggle any discount on/off
- Rename them (e.g., "First Disc" → "Trade Offer")
- Create aggregations to combine them (e.g., combine all 4 into "Total Discount")

The expected API item structure for discounts:

```json
{
    "pricing": {
        "discounts": {
            "firstDisc": 100,
            "secondDisc": 50,
            "thirdDisc": 0,
            "fourthDisc": 0
        }
    }
}
```

---

## Employee-Specific Templates

Templates can be scoped per employee using the `employee_id` column.

### How it works:

1. **Listing templates**: Frontend sends `GET /templates?employee_id=2821`
2. **Creating templates**: Frontend sends `employee_id: 2821` in the POST body
3. **Setting default**: Frontend sends `employee_id: 2821` in the POST body — default is scoped per employee

### To integrate with your auth:

Update `getEmployeeId()` in `templateApi.js`:

```javascript
export const getEmployeeId = () => {
    // Read from your auth context, JWT, or user store
    const decoded = decodeJWT(ACCESS_TOKEN);
    return decoded?.user_id;
};
```

---

## Troubleshooting

### "Missing value for field: X" warnings in console
The template engine logs warnings for fields referenced in HTML but not found in the data object. This usually means:
- A mapping is missing for that field in `template_mappings`
- The API doesn't return that field

### Template preview shows `[fieldName]` instead of values
- The template engine couldn't find the field in the data. Check that:
  1. The field exists in `transformApiDataToTemplate` output
  2. The mapping has the correct `api_field_path`

### Print layout doesn't match preview
- The CSS has specific `@media print` rules. Ensure `invoiceGenerator.css` is loaded
- The `data-paper-size` attribute on `.invoice-paper` drives the print size

### Columns overflow the page
- The system automatically calculates column widths based on paper size and font size
- Reduce font size (slider in editor) or remove columns to fit

### Aggregation values show 0
- Ensure the source fields (`firstDisc`, `secondDisc`, etc.) are populated in the API response
- Check the console for `[Data Transformer] Aggregation` debug logs
