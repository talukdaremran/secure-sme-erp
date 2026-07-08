# Functional Requirements - Version 1

## Purpose

This document defines the functional requirements for Version 1 of the Secure SME ERP project.

Version 1 will focus on building a stable core ERP system before adding advanced AI and analytics features such as fraud detection, sales forecasting, and customer churn prediction.

## User Roles

### Admin

The Admin user has full access to the system. Admin users can manage staff accounts, view dashboard data, access audit logs, and manage core business records.

### Staff

The Staff user has limited access to daily ERP operations. Staff users can manage customers, products, sales orders, invoices, and inventory-related actions, but cannot manage roles or access sensitive administrative features.

---

## Version 1 Functional Requirements

### FR-01: User Registration

The system shall allow a new user to register an account using their name, email address, password, and requested role.

The system shall validate the email format and password strength before creating the account.

The system shall store passwords securely using hashing.

### FR-02: User Login

The system shall allow registered users to log in using their email address and password.

The system shall verify the user's credentials before granting access.

The system shall prevent unauthenticated users from accessing protected pages.

### FR-03: Role-Based Access Control

The system shall support at least two user roles: Admin and Staff.

The system shall restrict access to certain pages and actions based on the user's role.

Only Admin users shall be able to manage roles and view full audit logs.

### FR-04: Product Management

The system shall allow authorised users to create, view, update, and delete product records.

Each product shall include details such as product name, SKU, category, price, stock quantity, and low-stock alert level.

The system shall prevent duplicate SKU values.

### FR-05: Customer Management

The system shall allow authorised users to create, view, update, and delete customer records.

Each customer record shall include basic details such as name, email, phone number, and address.

### FR-06: Sales Order Management

The system shall allow authorised users to create sales orders for existing customers.

A sales order shall contain one or more products, quantities, and calculated totals.

The system shall check product availability before confirming a sales order.

### FR-07: Invoice Generation

The system shall allow authorised users to generate an invoice from a valid sales order.

The system shall calculate subtotal, GST, and total amount.

The system shall generate a unique invoice number for each invoice.

### FR-08: Payment Status Tracking

The system shall allow authorised users to update the payment status of an invoice.

Payment status values may include Pending, Paid, Failed, or Cancelled.

Version 1 will not include real payment gateway integration.

### FR-09: Inventory Updates

The system shall update inventory quantity based on business actions such as confirmed sales orders.

The system shall prevent stock quantity from becoming negative.

The system shall record important inventory changes for traceability.

### FR-10: Audit Logging

The system shall record important user actions in an audit log.

Audit logs shall include the user, action, affected module, timestamp, and result.

Important actions such as login, product changes, customer changes, sales order creation, invoice generation, and payment status updates shall be logged.

### FR-11: Dashboard

The system shall provide a basic dashboard for Admin users.

The dashboard shall show summary information such as total products, total customers, total sales orders, total invoices, and recent activity.

### FR-12: Logout

The system shall allow authenticated users to log out securely.

After logout, the user shall not be able to access protected pages without logging in again.

---

## Future Functional Requirements

The following features are planned for later versions and are not required for Version 1:

* Fraud or anomaly detection
* Sales forecasting
* Customer churn prediction
* Two-factor authentication
* Real email notifications
* File export
* Real payment gateway integration
* Multi-tenant SaaS billing
