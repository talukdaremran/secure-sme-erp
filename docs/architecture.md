# System Architecture - Version 1

## Purpose

This document describes the initial system architecture for Version 1 of the Secure SME ERP project.

The purpose of the architecture is to show how the main parts of the system will work together, including the frontend, backend, database, and future machine learning module.

Version 1 will focus on the core ERP system. Advanced AI and analytics features will be added after the core system is stable.

---

## Architecture Overview

The system will follow a layered web application architecture.

```text
User
  ↓
React Frontend
  ↓
Express Backend API
  ↓
PostgreSQL Database
```

Future AI and analytics features will be added using a separate Python machine learning module.

```text
Express Backend API
  ↓
Python ML Module
  ↓
Prediction Results
  ↓
PostgreSQL Database / Dashboard
```

---

## Main System Components

### 1. Frontend

The frontend will be built using React.

The frontend is responsible for:

* Displaying pages and forms to the user
* Sending user requests to the backend API
* Showing validation messages and system feedback
* Displaying dashboard summaries
* Rendering tables for products, customers, sales orders, invoices, and audit logs

The frontend should not directly access the database.

---

### 2. Backend API

The backend will be built using Node.js and Express.

The backend is responsible for:

* Handling API requests from the frontend
* Validating user input
* Managing authentication and login
* Enforcing role-based access control
* Processing business logic
* Reading from and writing to the database
* Creating audit log entries for important actions
* Returning safe responses to the frontend

The backend acts as the control layer between the frontend and the database.

---

### 3. Database

The database will use PostgreSQL.

The database is responsible for storing:

* Users and roles
* Products
* Customers
* Sales orders
* Sales order items
* Invoices
* Payments
* Inventory movements
* Audit logs

The database should store structured business data safely and consistently.

---

### 4. Future Machine Learning Module

The machine learning module will be added in a later version.

It may be built using Python and scikit-learn.

The ML module may support:

* Fraud or anomaly detection
* Sales forecasting
* Customer churn prediction

For Version 1, the ML module is not required. The first priority is to build a stable ERP core.

---

## Version 1 Request Flow

A normal Version 1 request will follow this flow:

```text
User action in React
  ↓
Frontend sends request to Express API
  ↓
Backend validates request
  ↓
Backend checks authentication and role permissions
  ↓
Backend applies business logic
  ↓
Backend reads or updates PostgreSQL database
  ↓
Backend records audit log if needed
  ↓
Backend sends response to frontend
  ↓
Frontend updates the user interface
```

---

## Example Flow: Creating a Sales Order

```text
Staff selects customer and products
  ↓
Frontend sends sales order request
  ↓
Backend validates customer and product data
  ↓
Backend checks stock availability
  ↓
Backend calculates subtotal, GST, and total
  ↓
Backend saves sales order and sales order items
  ↓
Backend updates inventory if required
  ↓
Backend records audit log
  ↓
Frontend shows confirmation message
```

---

## Security Architecture

Security will be handled mainly in the backend.

The system should include:

* Password hashing
* Protected API routes
* Role-based access control
* Input validation
* Audit logging
* Environment variables for sensitive configuration

Frontend checks may improve user experience, but backend checks are required for real security.

---

## Version 1 Scope Boundary

Version 1 includes:

* React frontend
* Express backend API
* PostgreSQL database
* Authentication
* Role-based access control
* Core ERP modules
* Audit logging
* Basic dashboard

Version 1 does not include:

* Real payment gateway integration
* Real email sending
* Advanced machine learning
* Microservices
* Mobile application
* Multi-tenant SaaS billing
