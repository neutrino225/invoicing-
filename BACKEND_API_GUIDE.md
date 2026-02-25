# Backend API Guide — Invoice Template System

This document specifies every API endpoint the frontend expects, with exact request/response formats. Use this to implement or adapt your backend.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoint Reference](#endpoint-reference)
   - [GET /templates](#get-templates)
   - [GET /templates/:id](#get-templatesid)
   - [POST /templates](#post-templates)
   - [PUT /templates/:id](#put-templatesid)
   - [DELETE /templates/:id](#delete-templatesid)
   - [POST /templates/:id/set-default](#post-templatesidset-default)
   - [GET /operation/get-order-invoice-data](#get-operationget-order-invoice-data)
3. [Database Schema](#database-schema)
4. [Backend Implementation Example (Node.js/Express)](#backend-implementation-example)

---

## Authentication

All requests include:

```
Header: x-access-token: <JWT_TOKEN>
```

The JWT payload contains:

```json
{
    "id": "user@example.com",
    "company_id": null,
    "user_id": 2821,
    "user_type": "manager",
    "user_type_id": null,
    "emptype_id": 4,
    "licenceId": 0,
    "iat": 1769058262,
    "exp": 8969058262
}
```

Use `user_id` from the JWT as the `employee_id` when the frontend sends it explicitly, or decode it server-side for additional security.

---

## Endpoint Reference

### GET /templates

**Purpose:** List all templates, optionally filtered by employee.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | integer | No | Filter templates by employee. If omitted, return all. |

**Response:** `200 OK`

```json
[
    {
        "id": 1,
        "employee_id": 2821,
        "name": "Standard Invoice",
        "description": "Default A4 invoice template",
        "is_default": true,
        "status": "active",
        "version": 1,
        "created_at": "2026-02-01T12:00:00.000Z",
        "updated_at": "2026-02-01T12:00:00.000Z"
    },
    {
        "id": 2,
        "employee_id": 2821,
        "name": "Compact A5",
        "description": null,
        "is_default": false,
        "status": "active",
        "version": 1,
        "created_at": "2026-02-02T12:00:00.000Z",
        "updated_at": "2026-02-02T12:00:00.000Z"
    }
]
```

**SQL:**

```sql
-- Without employee_id filter
SELECT id, employee_id, name, description, is_default, status, version, created_at, updated_at
FROM templates
WHERE status = 'active'
ORDER BY is_default DESC, created_at DESC;

-- With employee_id filter
SELECT id, employee_id, name, description, is_default, status, version, created_at, updated_at
FROM templates
WHERE status = 'active' AND employee_id = ?
ORDER BY is_default DESC, created_at DESC;
```

> **Note:** The list response does NOT need to include `html`, `template_config`, mappings, or aggregations. Only metadata fields.

---

### GET /templates/:id

**Purpose:** Get a single template with ALL its data (HTML, config, mappings, aggregations).

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Template ID |

**Response:** `200 OK`

```json
{
    "id": 1,
    "employee_id": 2821,
    "name": "Standard Invoice",
    "description": "Default A4 invoice template",
    "html": "<!DOCTYPE html><html>...[header.companyName]...[#lineItems]...[/lineItems]...</html>",
    "template_config": {
        "header": {
            "topRow": ["companyName", "invoiceType"],
            "left": ["customerName", "cnic", "phone", "address"],
            "right": ["distributorAddress", "distributorNTN", "distributorSTN", "tcn", "invoiceNo", "bookingDate", "deliveryDate", "booker", "salesman"]
        },
        "lineItems": ["sku", "ctn", "pcs", "rp", "tp", "tpVal", "firstDisc", "secondDisc", "thirdDisc", "fourthDisc", "grossValue", "others", "gstPercent", "gst", "advanceTax", "netValue"],
        "summary": ["totalQty", "tpValue", "totalDiscount", "totalDiscountPercent", "grossValue", "totalGSTValue", "totalADTValue", "netValue"],
        "showCtSize": true,
        "showBarcode": false,
        "showHsCode": false,
        "summaryLayout": "split",
        "fontSize": 9,
        "showTableBorders": false,
        "columnLabels": {
            "firstDisc": "Trade Offer"
        },
        "aggregations": [
            {
                "id": "agg_1706000000_abc123",
                "label": "Total Disc",
                "fields": ["firstDisc", "secondDisc"],
                "type": "replace"
            }
        ],
        "paperSize": "A4",
        "footer": [
            [
                { "text": "Thank you for your business", "align": "center" }
            ]
        ]
    },
    "is_default": true,
    "status": "active",
    "version": 1,
    "mappings": [
        {
            "id": 1,
            "template_id": 1,
            "section": "header",
            "template_field": "companyName",
            "api_field_path": "distributor.name",
            "custom_label": null,
            "field_order": 0
        },
        {
            "id": 2,
            "template_id": 1,
            "section": "header",
            "template_field": "invoiceType",
            "api_field_path": "invoiceType",
            "custom_label": null,
            "field_order": 1
        },
        {
            "id": 10,
            "template_id": 1,
            "section": "lineItems",
            "template_field": "sku",
            "api_field_path": "itemName",
            "custom_label": null,
            "field_order": 0
        },
        {
            "id": 11,
            "template_id": 1,
            "section": "lineItems",
            "template_field": "firstDisc",
            "api_field_path": "pricing.discounts.firstDisc",
            "custom_label": "Trade Offer",
            "field_order": 6
        }
    ],
    "aggregations": [
        {
            "id": 1,
            "template_id": 1,
            "aggregation_id": "agg_1706000000_abc123",
            "label": "Total Disc",
            "fields": ["firstDisc", "secondDisc"],
            "type": "replace",
            "field_order": 6
        }
    ],
    "created_at": "2026-02-01T12:00:00.000Z",
    "updated_at": "2026-02-01T12:00:00.000Z"
}
```

**SQL (3 queries, joined in response):**

```sql
-- 1. Get template
SELECT * FROM templates WHERE id = ?;

-- 2. Get mappings
SELECT * FROM template_mappings WHERE template_id = ? ORDER BY section, field_order;

-- 3. Get aggregations
SELECT * FROM template_aggregations WHERE template_id = ? ORDER BY field_order;
```

Then merge them into a single response object:

```javascript
const template = await getTemplate(id);
template.mappings = await getMappings(id);
template.aggregations = await getAggregations(id);
return template;
```

---

### POST /templates

**Purpose:** Create a new template with mappings and aggregations.

**Request Body:**

```json
{
    "name": "Standard Invoice",
    "description": "Default A4 invoice template",
    "html": "<!DOCTYPE html><html>...</html>",
    "template_config": { ... },
    "is_default": false,
    "employee_id": 2821,
    "mappings": [
        {
            "section": "header",
            "template_field": "companyName",
            "api_field_path": "distributor.name",
            "custom_label": null,
            "field_order": 0
        }
    ],
    "aggregations": [
        {
            "aggregation_id": "agg_1706000000_abc123",
            "label": "Total Disc",
            "fields": ["firstDisc", "secondDisc"],
            "type": "replace",
            "field_order": 6
        }
    ]
}
```

**Backend Logic:**

```sql
-- 1. If is_default = true, unset existing default for this employee
UPDATE templates SET is_default = 0
WHERE employee_id = ? AND is_default = 1;

-- 2. Insert template
INSERT INTO templates (name, description, html, template_config, is_default, employee_id, status)
VALUES (?, ?, ?, ?, ?, ?, 'active');
-- Get the inserted ID

-- 3. Insert mappings (batch)
INSERT INTO template_mappings (template_id, section, template_field, api_field_path, custom_label, field_order)
VALUES (?, ?, ?, ?, ?, ?);
-- Repeat for each mapping

-- 4. Insert aggregations (batch)
INSERT INTO template_aggregations (template_id, aggregation_id, label, fields, type, field_order)
VALUES (?, ?, ?, ?, ?, ?);
-- Repeat for each aggregation
-- Note: `fields` is a JSON array, store as JSON
```

**Response:** `201 Created`

```json
{
    "id": 3,
    "name": "Standard Invoice",
    "message": "Template created successfully"
}
```

---

### PUT /templates/:id

**Purpose:** Update an existing template.

**Request Body:** Same structure as POST (all fields that need updating).

**Backend Logic:**

```sql
-- 1. Update template row
UPDATE templates
SET name = ?, description = ?, html = ?, template_config = ?, is_default = ?
WHERE id = ?;

-- 2. Delete old mappings
DELETE FROM template_mappings WHERE template_id = ?;

-- 3. Insert new mappings
INSERT INTO template_mappings (template_id, section, template_field, api_field_path, custom_label, field_order)
VALUES (?, ?, ?, ?, ?, ?);

-- 4. Delete old aggregations
DELETE FROM template_aggregations WHERE template_id = ?;

-- 5. Insert new aggregations
INSERT INTO template_aggregations (template_id, aggregation_id, label, fields, type, field_order)
VALUES (?, ?, ?, ?, ?, ?);
```

**Response:** `200 OK`

```json
{
    "id": 3,
    "message": "Template updated successfully"
}
```

---

### DELETE /templates/:id

**Purpose:** Delete a template and its related data.

**Backend Logic:**

```sql
-- Delete in order (child tables first)
DELETE FROM template_aggregations WHERE template_id = ?;
DELETE FROM template_mappings WHERE template_id = ?;
DELETE FROM templates WHERE id = ?;
```

Or use soft delete:

```sql
UPDATE templates SET status = 'archived' WHERE id = ?;
```

**Response:** `200 OK`

```json
{
    "message": "Template deleted successfully"
}
```

---

### POST /templates/:id/set-default

**Purpose:** Set a template as the default for an employee.

**Request Body:**

```json
{
    "employee_id": 2821
}
```

**Backend Logic:**

```sql
-- 1. Unset current default for this employee
UPDATE templates SET is_default = 0
WHERE employee_id = ? AND is_default = 1;

-- 2. Set new default
UPDATE templates SET is_default = 1
WHERE id = ? AND employee_id = ?;
```

**Response:** `200 OK`

```json
{
    "message": "Default template updated successfully"
}
```

---

### GET /operation/get-order-invoice-data

**Purpose:** Fetch invoice/order data for rendering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | integer | Yes | The order ID |
| `baseurl` | string | No | Base URL for the upstream API |

**Response:** `200 OK`

```json
{
    "count": 1,
    "invoices": [
        {
            "invoiceId": 4678516,
            "invoiceType": "Invoice",
            "orderStatus": "NEW | DELIVERED",
            "dates": {
                "bookingDate": "2026-01-13T19:00:00.000Z",
                "deliveryDate": "2026-02-09",
                "printedOn": "2026-02-09"
            },
            "distributor": {
                "name": "IVY TEST",
                "printingName": "",
                "address": "islamabad",
                "ntn": "678",
                "stn": "678",
                "logo": "https://example.com/logo.jpg"
            },
            "customer": {
                "id": 257149,
                "businessName": "test",
                "name": "TEST",
                "address": "address",
                "zone": "islamabad 1",
                "phone": "0",
                "ntn": "",
                "gst": "Un-reg"
            },
            "salesman": "Test",
            "booker": "Ivy Official",
            "referenceNo": "",
            "items": [
                {
                    "srNo": 1,
                    "productId": 81,
                    "productName": "Tops",
                    "itemName": "Tops 250 ML",
                    "barCode": "",
                    "hsCode": null,
                    "ctnSize": 0,
                    "quantity": {
                        "ctn": 0,
                        "pcs": 400
                    },
                    "pricing": {
                        "retailPrice": 250,
                        "unitPrice": 200,
                        "tpValue": 80000,
                        "discounts": {
                            "firstDisc": 0,
                            "secondDisc": 0,
                            "thirdDisc": 0,
                            "fourthDisc": 0
                        },
                        "gst": {
                            "percent": 0,
                            "value": 0
                        },
                        "advanceTax": 2000,
                        "netValue": 82000
                    },
                    "isFOC": false
                }
            ],
            "totals": {
                "totalTPVal": 180000,
                "totalDiscount": 0,
                "totalGrossValue": 180000,
                "totalGSTValue": 0,
                "totalADTValue": 2000,
                "totalNetValue": 182000,
                "totalFOCPcs": 0,
                "totalInvoiceCtn": 16,
                "totalInvoicePcs": 416,
                "totalDiscountPercent": "0.00"
            },
            "fbr": null,
            "notes": {
                "orderComment": "",
                "saleNotes": "0"
            }
        }
    ]
}
```

> **Important:** The frontend reads `response.data.invoices[0]` — it expects the data inside an `invoices` array.

---

## Database Schema

### Entity Relationship

```
templates (1) ──── (N) template_mappings
templates (1) ──── (N) template_aggregations
```

### Full Schema Summary

```
templates
├── id (PK, AUTO_INCREMENT)
├── employee_id (INT, nullable, indexed)
├── name (VARCHAR 255)
├── description (TEXT, nullable)
├── html (TEXT) — Generated HTML with [PLACEHOLDER] syntax
├── template_config (JSON) — Full UI state for restoring editor
├── is_default (BOOLEAN)
├── version (INT)
├── status (ENUM: active/draft/archived)
├── metadata (JSON, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

template_mappings
├── id (PK, AUTO_INCREMENT)
├── template_id (FK → templates.id)
├── section (VARCHAR 50) — header/lineItems/summary/notes
├── template_field (VARCHAR 100) — e.g., "companyName", "sku", "firstDisc"
├── api_field_path (VARCHAR 255) — e.g., "distributor.name", "pricing.discounts.firstDisc"
├── custom_label (VARCHAR 255, nullable)
├── field_order (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

template_aggregations
├── id (PK, AUTO_INCREMENT)
├── template_id (FK → templates.id)
├── aggregation_id (VARCHAR 100) — e.g., "agg_1706000000_abc123"
├── label (VARCHAR 255) — e.g., "Total Discount"
├── fields (JSON) — e.g., ["firstDisc", "secondDisc"]
├── type (ENUM: add/replace)
├── field_order (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## Backend Implementation Example

Here's a reference implementation using Node.js + Express + MySQL:

### Route: List Templates

```javascript
router.get('/templates', async (req, res) => {
    try {
        const { employee_id } = req.query;

        let sql = `SELECT id, employee_id, name, description, is_default, status, version, created_at, updated_at
                    FROM templates WHERE status = 'active'`;
        const params = [];

        if (employee_id) {
            sql += ` AND employee_id = ?`;
            params.push(employee_id);
        }

        sql += ` ORDER BY is_default DESC, created_at DESC`;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
```

### Route: Get Single Template

```javascript
router.get('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [[template]] = await db.query('SELECT * FROM templates WHERE id = ?', [id]);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Parse template_config if stored as string
        if (typeof template.template_config === 'string') {
            template.template_config = JSON.parse(template.template_config);
        }

        const [mappings] = await db.query(
            'SELECT * FROM template_mappings WHERE template_id = ? ORDER BY section, field_order',
            [id]
        );

        const [aggregations] = await db.query(
            'SELECT * FROM template_aggregations WHERE template_id = ? ORDER BY field_order',
            [id]
        );

        // Parse JSON fields in aggregations
        aggregations.forEach(agg => {
            if (typeof agg.fields === 'string') {
                agg.fields = JSON.parse(agg.fields);
            }
        });

        template.mappings = mappings;
        template.aggregations = aggregations;

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
```

### Route: Create Template

```javascript
router.post('/templates', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description, html, template_config, is_default, employee_id, mappings, aggregations } = req.body;

        // Unset existing default if needed
        if (is_default && employee_id) {
            await connection.query(
                'UPDATE templates SET is_default = 0 WHERE employee_id = ? AND is_default = 1',
                [employee_id]
            );
        }

        // Insert template
        const [result] = await connection.query(
            `INSERT INTO templates (name, description, html, template_config, is_default, employee_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [name, description, html, JSON.stringify(template_config), is_default || false, employee_id]
        );
        const templateId = result.insertId;

        // Insert mappings
        if (mappings && mappings.length > 0) {
            const mappingValues = mappings.map(m => [
                templateId, m.section, m.template_field, m.api_field_path, m.custom_label, m.field_order
            ]);
            await connection.query(
                `INSERT INTO template_mappings (template_id, section, template_field, api_field_path, custom_label, field_order)
                 VALUES ?`,
                [mappingValues]
            );
        }

        // Insert aggregations
        if (aggregations && aggregations.length > 0) {
            const aggValues = aggregations.map(a => [
                templateId, a.aggregation_id, a.label, JSON.stringify(a.fields), a.type, a.field_order
            ]);
            await connection.query(
                `INSERT INTO template_aggregations (template_id, aggregation_id, label, fields, type, field_order)
                 VALUES ?`,
                [aggValues]
            );
        }

        await connection.commit();
        res.status(201).json({ id: templateId, name, message: 'Template created successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});
```

### Route: Update Template

```javascript
router.put('/templates/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { name, description, html, template_config, is_default, mappings, aggregations } = req.body;

        // Update template
        await connection.query(
            `UPDATE templates SET name = ?, description = ?, html = ?, template_config = ?, is_default = ?
             WHERE id = ?`,
            [name, description, html, JSON.stringify(template_config), is_default || false, id]
        );

        // Replace mappings
        await connection.query('DELETE FROM template_mappings WHERE template_id = ?', [id]);
        if (mappings && mappings.length > 0) {
            const mappingValues = mappings.map(m => [
                id, m.section, m.template_field, m.api_field_path, m.custom_label, m.field_order
            ]);
            await connection.query(
                `INSERT INTO template_mappings (template_id, section, template_field, api_field_path, custom_label, field_order)
                 VALUES ?`,
                [mappingValues]
            );
        }

        // Replace aggregations
        await connection.query('DELETE FROM template_aggregations WHERE template_id = ?', [id]);
        if (aggregations && aggregations.length > 0) {
            const aggValues = aggregations.map(a => [
                id, a.aggregation_id, a.label, JSON.stringify(a.fields), a.type, a.field_order
            ]);
            await connection.query(
                `INSERT INTO template_aggregations (template_id, aggregation_id, label, fields, type, field_order)
                 VALUES ?`,
                [aggValues]
            );
        }

        await connection.commit();
        res.json({ id: parseInt(id), message: 'Template updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});
```

### Route: Delete Template

```javascript
router.delete('/templates/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        await connection.query('DELETE FROM template_aggregations WHERE template_id = ?', [id]);
        await connection.query('DELETE FROM template_mappings WHERE template_id = ?', [id]);
        await connection.query('DELETE FROM templates WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});
```

### Route: Set Default Template

```javascript
router.post('/templates/:id/set-default', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { employee_id } = req.body;

        // Unset current default for this employee
        await connection.query(
            'UPDATE templates SET is_default = 0 WHERE employee_id = ? AND is_default = 1',
            [employee_id]
        );

        // Set new default
        await connection.query(
            'UPDATE templates SET is_default = 1 WHERE id = ? AND employee_id = ?',
            [id, employee_id]
        );

        await connection.commit();
        res.json({ message: 'Default template updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});
```
