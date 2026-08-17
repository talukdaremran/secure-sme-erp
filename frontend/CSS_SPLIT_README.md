# CoreFlow CSS split pack

Copy the files inside `frontend/src/styles/` into your project.
Replace your current `frontend/src/index.css` with the included cleaner `frontend/src/index.css`.

## Main imports

In `frontend/src/main.jsx`, keep `index.css` and add shared CSS directly after it:

```jsx
import "./index.css";
import "./styles/shared.css";
```

## Layout imports

In `frontend/src/layouts/AppLayout.jsx`:

```jsx
import "../styles/appShell.css";
```

In `frontend/src/layouts/CustomerPortalLayout.jsx`:

```jsx
import "../styles/customerPortal.css";
```

In `frontend/src/layouts/SupplierPortalLayout.jsx`:

```jsx
import "../styles/supplierPortal.css";
```

## Page imports

Add the import at the top of each page component:

```txt
LandingPage.jsx                  -> import "../styles/landing.css";
PortalLoginPage.jsx              -> import "../styles/portalAuth.css";
PortalRegisterPage.jsx           -> import "../styles/portalAuth.css";
PortalVerifyEmailPage.jsx        -> import "../styles/portalAuth.css";
PortalHomePage.jsx               -> import "../styles/portalAuth.css";
LoginPage.jsx                    -> import "../styles/auth.css";
DashboardPage.jsx                -> import "../styles/dashboard.css";
AiAnalyticsPage.jsx              -> import "../styles/aiAnalytics.css";
ProductsPage.jsx                 -> import "../styles/products.css";
SalesOrdersPage.jsx              -> import "../styles/salesOrders.css";
PurchaseOrdersPage.jsx           -> import "../styles/purchaseOrders.css";
InvoicesPage.jsx                 -> import "../styles/invoices.css";
InventoryPage.jsx                -> import "../styles/inventory.css";
AuditLogsPage.jsx                -> import "../styles/auditLogs.css";
CustomersPage.jsx                -> import "../styles/customers.css";
UsersPage.jsx                    -> import "../styles/users.css";
ProfilePage.jsx                  -> import "../styles/profile.css";
ApprovalRequestsPage.jsx         -> import "../styles/approvals.css";
InventoryAdjustmentsPage.jsx     -> import "../styles/approvals.css";  // if this is your approval page name
```

## Optional import

Only import this if some older internal pages lose mobile responsiveness:

```jsx
import "../styles/internalResponsive.css";
```

A good place is `AppLayout.jsx` after `appShell.css`:

```jsx
import "../styles/appShell.css";
import "../styles/internalResponsive.css";
```

## Do not import legacy supplier CSS

`frontend/src/styles/supplierPortal.legacy-remove-from-index.css` is included only so you can see what was removed from `index.css`. Do not import it.

## Suggested test order

1. Restart frontend dev server.
2. Login page.
3. Employee dashboard.
4. Products.
5. Inventory.
6. AI Analytics.
7. Customer portal.
8. Supplier portal.
