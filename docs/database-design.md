# Database Design - Version 1

## Purpose

This document describes the initial database design for Version 1 of the Secure SME ERP project.

The goal of the Version 1 database is to support the core ERP features, including user authentication, role-based access control, product management, customer management, sales orders, invoices, payment status tracking, inventory updates, audit logging, and dashboard summaries.

Advanced AI and analytics features such as fraud detection, sales forecasting, and customer churn prediction will be added in later versions.

---

## Initial V1 Tables

The first version of the system will use the following main tables:

1. users
2. roles
3. products
4. customers
5. sales_orders
6. sales_order_items
7. invoices
8. payments
9. inventory_movements
10. audit_logs

---

## Table: roles

### Purpose

Stores the available user roles in the system.

### Important Fields

* id
* name
* description
* created_at
* updated_at

### Example Roles

* Admin
* Staff

### Notes

Roles are used to control what users can access inside the system.

---

## Table: users

### Purpose

Stores user account information for login and role-based access control.

### Important Fields

* id
* name
* email
* password_hash
* role_id
* status
* created_at
* updated_at

### Notes

The password should never be stored as plain text. Only a secure password hash should be stored.

The `role_id` field connects each user to a role.

---

## Table: products

### Purpose

Stores product and inventory-related information.

### Important Fields

* id
* name
* sku
* category
* price
* stock_quantity
* low_stock_level
* created_at
* updated_at

### Notes

The SKU should be unique so that products can be identified clearly.

The system should prevent stock quantity from becoming negative.

---

## Table: customers

### Purpose

Stores customer information used for sales orders and invoices.

### Important Fields

* id
* name
* email
* phone
* address
* created_at
* updated_at

### Notes

Customers are linked to sales orders and invoices.

---

## Table: sales_orders

### Purpose

Stores the main sales order record.

### Important Fields

* id
* customer_id
* created_by
* status
* subtotal
* gst_amount
* total_amount
* created_at
* updated_at

### Notes

Each sales order belongs to one customer.

The `created_by` field connects the sales order to the user who created it.

---

## Table: sales_order_items

### Purpose

Stores the individual products inside a sales order.

### Important Fields

* id
* sales_order_id
* product_id
* quantity
* unit_price
* line_total

### Notes

A sales order can contain multiple products.

This table connects sales orders and products.

---

## Table: invoices

### Purpose

Stores invoice records generated from sales orders.

### Important Fields

* id
* sales_order_id
* invoice_number
* subtotal
* gst_amount
* total_amount
* status
* issued_at
* created_at
* updated_at

### Notes

Each invoice is created from a valid sales order.

The invoice number must be unique.

---

## Table: payments

### Purpose

Stores payment status information for invoices.

### Important Fields

* id
* invoice_id
* status
* amount
* payment_method
* paid_at
* created_at
* updated_at

### Notes

Version 1 will not use a real payment gateway.

Payment status will be updated manually inside the system.

Example payment statuses:

* Pending
* Paid
* Failed
* Cancelled

---

## Table: inventory_movements

### Purpose

Tracks important stock changes for traceability.

### Important Fields

* id
* product_id
* movement_type
* quantity_change
* reason
* related_sales_order_id
* created_by
* created_at

### Notes

This table helps explain why stock quantity changed.

Example movement types:

* Sale
* Adjustment
* Return

---

## Table: audit_logs

### Purpose

Stores important user actions for security and traceability.

### Important Fields

* id
* user_id
* action
* module
* entity_type
* entity_id
* result
* created_at

### Notes

Audit logs should record important system actions such as login, product changes, customer changes, sales order creation, invoice generation, payment status updates, and role changes.

Audit logs should not be edited or deleted through the normal application interface.

---

## Basic Relationships

* One role can have many users.
* One user belongs to one role.
* One customer can have many sales orders.
* One sales order belongs to one customer.
* One sales order can have many sales order items.
* One sales order item belongs to one product.
* One sales order can have one invoice.
* One invoice can have one or more payment records.
* One product can have many inventory movement records.
* One user can create many audit log records.

---

## Future Tables

The following tables may be added in later versions:

* fraud_alerts
* sales_forecasts
* churn_predictions
* export_files
* user_sessions
* password_reset_tokens
* two_factor_auth_settings

These tables are not required for the first version of the core ERP system.
