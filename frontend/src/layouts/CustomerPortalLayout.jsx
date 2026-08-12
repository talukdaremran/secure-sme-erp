import { Link, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBox, FiLogOut, FiShoppingCart, FiUser } from "react-icons/fi";
import { useCustomerCart } from "../context/CustomerCartContext";
import { usePortalAuth } from "../context/PortalAuthContext";

function CustomerPortalLayout() {
  const navigate = useNavigate();
  const { portalUser, portalLoading, portalLogout } = usePortalAuth();
  const { cartCount, clearCart } = useCustomerCart();

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
    <section className="customer-portal-shell">
      <header className="customer-portal-header">
        <Link to="/" className="back-link">
          <FiArrowLeft />
          Landing
        </Link>

        <div>
          <h1>Customer Portal</h1>
          <p>Welcome, {portalUser.name}</p>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          <FiLogOut />
          Logout
        </button>
      </header>

      <nav className="customer-portal-nav">
        <NavLink to="/customer/products">
          <FiBox />
          Products
        </NavLink>

        <NavLink to="/customer/cart">
          <FiShoppingCart />
          Cart ({cartCount})
        </NavLink>

        <NavLink to="/customer/orders">
          <FiUser />
          My Orders
        </NavLink>
      </nav>

      <Outlet />
    </section>
  );
}

export default CustomerPortalLayout;