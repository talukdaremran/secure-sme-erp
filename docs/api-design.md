# API Design - Version 1

## Purpose

This document describes the initial API design for Version 1 of the Secure SME ERP project.

The API will be built with Node.js and Express. It will allow the React frontend to communicate with the backend and database.

Version 1 focuses on the core ERP system. Advanced AI and analytics endpoints will be added in later versions.

---

## API Design Principles

* API routes should be grouped by feature/module.
* Protected routes should require authentication.
* Admin-only routes should check the user's role.
* Backend validation is required before saving data.
* Important actions should create audit log records.
* API responses should be clear and consistent.

---

## Authentication Routes

### Register User

```http
POST /api/auth/register
```

Purpose:

Register a new user account.

Access:

Public

Expected data:

* name
* email
* password
* requested role

Notes:

Password must be hashed before storing.

---

### Login User

```http
POST /api/auth/login
```

Purpose:

Authenticate a user and start a session or return an authentication token.

Access:

Public

Expected data:

* email
* password

Notes:

Failed login attempts should be logged.

---

### Logout User

```http
POST /api/auth/logout
```

Purpose:

Log out the current authenticated user.

Access:

Authenticated users

---

### Get Current User

```http
GET /api/auth/me
```

Purpose:

Return the currently authenticated user's basic details.

Access:

Authenticated users

---

## User and Role Routes

### Get All Users

```http
GET /api/users
```

Purpose:

Return a list of users.

Access:

Admin only

---

### Update User Role

```http
PATCH /api/users/:id/role
```

Purpose:

Update a user's role.

Access:

Admin only

Expected data:

* role_id

Notes:

Role changes must be recorded in audit logs.

---

## Product Routes

### Get All Products

```http
GET /api/products
```

Purpose:

Return all products.

Access:

Authenticated users

---

### Get Single Product

```http
GET /api/products/:id
```

Purpose:

Return details for one product.

Access:

Authenticated users

---

### Create Product

```http
POST /api/products
```

Purpose:

Create a new product.

Access:

Authenticated users

Expected data:

* name
* sku
* category
* price
* stock_quantity
* low_stock_level

Notes:

SKU must be unique.

---

### Update Product

```http
PUT /api/products/:id
```

Purpose:

Update an existing product.

Access:

Authenticated users

---

### Delete Product

```http
DELETE /api/products/:id
```

Purpose:

Delete or deactivate a product.

Access:

Admin only or restricted staff action

Notes:

A soft delete may be safer than permanently deleting product records.

---

## Customer Routes

### Get All Customers

```http
GET /api/customers
```

Purpose:

Return all customers.

Access:

Authenticated users

---

### Get Single Customer

```http
GET /api/customers/:id
```

Purpose:

Return details for one customer.

Access:

Authenticated users

---

### Create Customer

```http
POST /api/customers
```

Purpose:

Create a new customer.

Access:

Authenticated users

Expected data:

* name
* email
* phone
* address

---

### Update Customer

```http
PUT /api/customers/:id
```

Purpose:

Update an existing customer.

Access:

Authenticated users

---

### Delete Customer

```http
DELETE /api/customers/:id
```

Purpose:

Delete or deactivate a customer.

Access:

Admin only or restricted staff action

---

## Sales Order Routes

### Get All Sales Orders

```http
GET /api/sales-orders
```

Purpose:

Return all sales orders.

Access:

Authenticated users

---

### Get Single Sales Order

```http
GET /api/sales-orders/:id
```

Purpose:

Return details for one sales order, including order items.

Access:

Authenticated users

---

### Create Sales Order

```http
POST /api/sales-orders
```

Purpose:

Create a sales order for a customer.

Access:

Authenticated users

Expected data:

* customer_id
* items

  * product_id
  * quantity

Notes:

The backend should check stock availability and calculate totals.

---

## Invoice Routes

### Get All Invoices

```http
GET /api/invoices
```

Purpose:

Return all invoices.

Access:

Authenticated users

---

### Get Single Invoice

```http
GET /api/invoices/:id
```

Purpose:

Return details for one invoice.

Access:

Authenticated users

---

### Generate Invoice

```http
POST /api/invoices
```

Purpose:

Generate an invoice from a valid sales order.

Access:

Authenticated users

Expected data:

* sales_order_id

Notes:

The backend should generate a unique invoice number and calculate subtotal, GST, and total amount.

---

## Payment Routes

### Update Payment Status

```http
PATCH /api/invoices/:id/payment-status
```

Purpose:

Update the payment status of an invoice.

Access:

Authenticated users

Expected data:

* status
* payment_method

Notes:

Version 1 will not use real payment gateway integration.

---

## Inventory Routes

### Get Inventory Movements

```http
GET /api/inventory-movements
```

Purpose:

Return stock movement history.

Access:

Authenticated users

---

### Create Inventory Adjustment

```http
POST /api/inventory-movements
```

Purpose:

Record a manual inventory adjustment if needed.

Access:

Admin only or restricted staff action

Expected data:

* product_id
* quantity_change
* reason

Notes:

The system must prevent stock quantity from becoming negative.

---

## Dashboard Routes

### Get Dashboard Summary

```http
GET /api/dashboard/summary
```

Purpose:

Return summary data for the dashboard.

Access:

Admin users

Example data:

* total products
* total customers
* total sales orders
* total invoices
* total revenue
* recent activity

---

## Audit Log Routes

### Get Audit Logs

```http
GET /api/audit-logs
```

Purpose:

Return audit log records.

Access:

Admin only

Notes:

Audit logs should support filtering later by user, module, action, or date.

---

## Future API Routes

The following API groups may be added in later versions:

* `/api/fraud-alerts`
* `/api/sales-forecasts`
* `/api/churn-predictions`
* `/api/exports`
* `/api/two-factor-auth`

These are not required for the Version 1 core ERP implementation.
