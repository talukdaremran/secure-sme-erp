import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBox,
  FiChevronRight,
  FiCheck,
  FiClipboard,
  FiFileText,
  FiLogOut,
  FiPlusCircle,
  FiSettings,
  FiShoppingCart,
  FiUser,
  FiUsers,
  FiLayers,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import appIcon from "../assets/favicon.svg";

function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const isAdmin = user?.role === "Admin";

  function handleToggleAccountMenu() {
    setIsAccountMenuOpen((currentValue) => {
      if (currentValue) {
        setIsAccountSwitcherOpen(false);
      }

      return !currentValue;
    });
  }

  function handleOpenProfile() {
    setIsAccountMenuOpen(false);
    setIsAccountSwitcherOpen(false);
    navigate("/profile");
  }

  function handleToggleAccountSwitcher() {
    if (!isAdmin) {
      handleOpenProfile();
      return;
    }

    setIsAccountSwitcherOpen((currentValue) => !currentValue);
  }

  function handleLogout() {
    setIsAccountMenuOpen(false);
    setIsAccountSwitcherOpen(false);
    logout();
    navigate("/login");
  }

  function handleCloseAccountSwitcher() {
    setIsAccountSwitcherOpen(false);
  }

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    function handleClickOutside(event) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
        setIsAccountSwitcherOpen(false);
      }
    }

    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsAccountSwitcherOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isAccountMenuOpen]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <img src={appIcon} alt="SME ERP logo" />
          </div>

          <div>
            <h2>SME ERP</h2>
            <p>Secure Business Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <NavLink to="/dashboard">
              <FiBarChart2 />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink to="/products">
            <FiBox />
            <span>Products</span>
          </NavLink>

          <NavLink to="/customers">
            <FiUsers />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/sales-orders">
            <FiShoppingCart />
            <span>Sales Orders</span>
          </NavLink>

          <NavLink to="/invoices">
            <FiFileText />
            <span>Invoices</span>
          </NavLink>

          <NavLink to="/inventory">
            <FiArchive />
            <span>Inventory</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/audit-logs">
                <FiActivity />
                <span>Audit Logs</span>
              </NavLink>

              <NavLink to="/users">
                <FiClipboard />
                <span>Users</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="account-menu-wrapper" ref={accountMenuRef}>
              <button
                type="button"
                className="user-card account-menu-trigger"
                onClick={handleToggleAccountMenu}
                aria-expanded={isAccountMenuOpen}
                aria-label="Open account menu"
              >
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>{user.name}</strong>
                  <span>{user.role}</span>
                </div>

                <FiChevronRight className="account-trigger-arrow" />
              </button>

              {isAccountMenuOpen && (
                <div className="account-menu">
                  <div className="account-menu-user-row-wrapper">
                    <button
                      type="button"
                      className={`account-menu-user-row ${
                        isAccountSwitcherOpen ? "account-menu-user-row-active" : ""
                      }`}
                      onClick={handleToggleAccountSwitcher}
                    >
                      <div className="account-menu-user">
                        <div className="user-avatar">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>

                        <div className="account-menu-text">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>

                      {isAdmin && <FiChevronRight />}
                    </button>

                    {isAdmin && isAccountSwitcherOpen && (
                      <div className="account-switcher-menu">
                        <button
                          type="button"
                          className="account-switcher-account"
                        >
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>

                          <div className="account-menu-text">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>

                          <FiCheck className="account-check-icon" />
                        </button>

                        <button
                          type="button"
                          className="account-switcher-add"
                          onClick={() => {}}
                        >
                          <FiPlusCircle />
                          <span>Add another account</span>
                          <small>Future</small>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="account-menu-divider" />

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    onMouseEnter={handleCloseAccountSwitcher}
                  >
                    <FiUser />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    disabled
                    onMouseEnter={handleCloseAccountSwitcher}
                  >
                    <FiSettings />
                    <span>Settings</span>
                    <small>Soon</small>
                  </button>

                  <div className="account-menu-divider" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    onMouseEnter={handleCloseAccountSwitcher}
                    className="account-menu-danger"
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Secure SME ERP</p>
            <h1>Business Management System</h1>
          </div>

          {user && (
            <button
              type="button"
              className="topbar-user topbar-account-button"
              onClick={handleOpenProfile}
            >
              <span>{user.role}</span>
              <div className="topbar-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </button>
          )}
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;