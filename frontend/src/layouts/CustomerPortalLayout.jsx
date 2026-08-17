import { useEffect } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiBox,
  FiLogOut,
  FiShoppingBag,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";

import { useCustomerCart } from "../context/CustomerCartContext";
import { usePortalAuth } from "../context/PortalAuthContext";
import "../styles/customerPortal.css";

const pageTitles = {
  "/customer/products": "Products",
  "/customer/cart": "Cart",
  "/customer/orders": "Orders",
};

function getCustomerPageTitle(pathname) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  if (pathname.startsWith("/customer/products/")) {
    return "Product Details";
  }

  return "Customer Portal";
}

function CustomerPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { portalUser, portalLoading, portalLogout } = usePortalAuth();
  const { cartCount, clearCart } = useCustomerCart();

  const pageTitle = getCustomerPageTitle(location.pathname);

  useEffect(() => {
    document.title = `${pageTitle} | CoreFlow`;
  }, [pageTitle]);

  if (portalLoading) {
    return (
      <section className="portal-home-page">
        <p>Loading customer portal...</p>
      </section>
    );
  }

  if (!portalUser) {
    return <Navigate to="/customer/login" replace />;
  }

  if (portalUser.role !== "customer") {
    return <Navigate to={`/${portalUser.role}/home`} replace />;
  }

  function handleLogout() {
    clearCart();
    portalLogout();
    navigate("/customer/login");
  }

  return (
    <div className="cf-customer-shell">
      <header className="cf-customer-topbar">
        <div className="cf-customer-brand">
          <div className="cf-customer-brand-icon">
            <FiShoppingBag />
          </div>

          <div>
            <span>CoreFlow</span>
            <strong>Customer Ordering</strong>
          </div>
        </div>

        <nav className="cf-customer-nav" aria-label="Customer portal navigation">
          <NavLink
            to="/customer/products"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FiBox />
            Products
          </NavLink>

          <NavLink
            to="/customer/cart"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FiShoppingCart />
            Cart
            <span className="cf-cart-count">{cartCount}</span>
          </NavLink>

          <NavLink
            to="/customer/orders"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FiUser />
            Orders
          </NavLink>
        </nav>

        <div className="cf-customer-account">
          <span>{portalUser?.customer_name || "Customer"}</span>

          <button type="button" onClick={handleLogout}>
            <FiLogOut />
            Logout
          </button>
        </div>
      </header>

      <main className="cf-customer-main">
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerPortalLayout;