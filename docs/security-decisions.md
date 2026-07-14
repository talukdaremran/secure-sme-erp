# Security Decisions - Version 1

## Purpose

This document records the main security decisions for Version 1 of the Secure SME ERP project.

The goal is to build the core ERP system with basic but important security practices from the beginning, instead of adding security as an afterthought.

---

## Password Storage

User passwords must never be stored as plain text.

The backend will store only hashed passwords.

Version 1 will use a secure password hashing library such as `bcrypt`.

Password rules:

* Passwords must be hashed before being saved
* Plain text passwords must never be returned in API responses
* Password fields should not appear in normal user queries
* Login should compare the submitted password with the stored password hash

---

## Authentication

Version 1 will use email and password login.

The system will include:

* User registration
* User login
* User logout
* Protected routes
* Current user check endpoint

After successful login, the system should allow the user to access protected pages.

Unauthenticated users must not be able to access protected ERP features.

---

## Role-Based Access Control

The system will support two roles in Version 1:

* Admin
* Staff

### Admin

Admin users can:

* View dashboard summaries
* Manage users and roles
* View audit logs
* Manage products
* Manage customers
* Manage sales orders
* Generate invoices
* Update payment statuses

### Staff

Staff users can:

* Manage products
* Manage customers
* Create sales orders
* Generate invoices
* Update payment statuses

Staff users cannot:

* Manage user roles
* View full audit logs
* Access admin-only settings

Role checks must happen in the backend, not only in the frontend.

---

## Input Validation

The backend must validate important user input before saving data.

Examples:

* Email must have a valid format
* Password must meet minimum strength rules
* Product SKU must not be empty
* Product price must be a positive number
* Stock quantity must not become negative
* Sales order quantity must be greater than zero
* Invoice status must use an allowed value
* Payment status must use an allowed value

Frontend validation can improve user experience, but backend validation is required for security and data integrity.

---

## Database Safety

The backend should use parameterised queries or a safe database library to reduce SQL injection risk.

The application should not build SQL queries by directly joining user input into query strings.

Important database rules:

* Use unique constraints where needed
* Use foreign keys for relationships
* Prevent invalid records where possible
* Avoid deleting important business records permanently unless necessary

Soft delete may be used later for important business records.

---

## Audit Logging

Important actions should be recorded in audit logs.

Audit logs should include:

* User ID
* Action
* Module
* Entity type
* Entity ID
* Result
* Timestamp

Examples of actions to log:

* User login
* Failed login attempt
* Product created or updated
* Customer created or updated
* Sales order created
* Invoice generated
* Payment status updated
* Role changed

Audit logs should not be editable or deletable through normal application features.

---

## Environment Variables

Sensitive configuration should be stored in environment variables.

Examples:

* Database connection string
* Session secret or JWT secret
* Backend port
* Frontend URL
* API keys used later

Sensitive values should not be committed to GitHub.

A `.env.example` file can be created later to show required environment variables without exposing real secrets.

---

## Version 1 Security Scope

Version 1 includes:

* Password hashing
* Protected routes
* Role-based access control
* Backend input validation
* Audit logging
* Environment variables

Version 1 does not include:

* Two-factor authentication
* Real payment gateway security
* Advanced fraud prevention
* Advanced penetration testing
* Multi-tenant SaaS isolation
* Automated email verification
