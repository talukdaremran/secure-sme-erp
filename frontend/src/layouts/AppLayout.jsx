import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  FiTruck,
  FiShoppingBag,
  FiShield,
  FiCpu,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import appIcon from "../assets/favicon.svg";
import "../styles/appShell.css";
import "../styles/internalResponsive.css";

const pageTitles = {
  "/dashboard": "Operations Overview",
  "/ai-analytics": "Intelligence Hub",
  "/products": "Products",
  "/customers": "Customers",
  "/sales-orders": "Sales Fulfilment",
  "/invoices": "Invoices",
  "/inventory": "Stock Control",
  "/audit-logs": "Security Monitor",
  "/users": "Team Access",
  "/suppliers": "Suppliers",
  "/purchase-orders": "Procurement",
  "/approvals": "Control Centre",
};

function AppLayout() {
  const navigate = useNavigate();
  const { user, savedAccounts, logout, switchAccount, removeSavedAccount } =
    useAuth();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isLogoutMenuOpen, setIsLogoutMenuOpen] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(null);
  const accountMenuRef = useRef(null);

  const isAdmin = user?.role === "Admin";
  const canUseAccountSwitcher = isAdmin || savedAccounts.length > 1;

  function handleToggleAccountMenu() {
    setIsAccountSwitcherOpen(false);
    setIsLogoutMenuOpen(false);
    setIsAccountMenuOpen((currentValue) => !currentValue);
  }

  function handleToggleLogoutMenu() {
    if (savedAccounts.length <= 1) {
      handleLogout();
      return;
    }

    setIsAccountSwitcherOpen(false);
    setIsLogoutMenuOpen((currentValue) => !currentValue);
  }

  function handleOpenProfile() {
    setIsAccountMenuOpen(false);
    setIsAccountSwitcherOpen(false);
    setIsLogoutMenuOpen(false);
    navigate("/profile");
  }

  function handleToggleAccountSwitcher() {
    if (!canUseAccountSwitcher) {
      handleOpenProfile();
      return;
    }

    setIsLogoutMenuOpen(false);
    setIsAccountSwitcherOpen((currentValue) => !currentValue);
  }

  function handleLogout() {
    setIsAccountMenuOpen(false);
    setIsAccountSwitcherOpen(false);
    setIsLogoutMenuOpen(false);
    logout();
    navigate("/login");
  }

  async function handleLogoutSavedAccount(accountId) {
    const accountToRemove = savedAccounts.find(
      (account) => account.id === accountId
    );

    if (!accountToRemove) {
      return;
    }

    try {
      setSwitchingAccount({
        ...accountToRemove,
        switchingMessage: `Signing out ${accountToRemove.name}...`,
      });

      setIsAccountMenuOpen(false);
      setIsAccountSwitcherOpen(false);
      setIsLogoutMenuOpen(false);

      await sleep(500);

      const remainingActiveUser = await removeSavedAccount(accountId);

      await sleep(250);

      if (!remainingActiveUser) {
        navigate("/login");
        return;
      }

      navigate(getDefaultRouteForRole(remainingActiveUser.role));
    } catch (error) {
      console.error(error);
      navigate("/login");
    } finally {
      setSwitchingAccount(null);
    }
  }

  function handleCloseSideMenus() {
    setIsAccountSwitcherOpen(false);
    setIsLogoutMenuOpen(false);
  }

  function getDefaultRouteForRole(role) {
    return role === "Admin" ? "/dashboard" : "/products";
  }

  function handleAddAnotherAccount() {
    if (!isAdmin) {
      return;
    }

    setIsAccountMenuOpen(false);
    setIsAccountSwitcherOpen(false);
    navigate("/login?mode=add-account");
  }

  async function handleSwitchAccount(accountId) {
    if (accountId === user?.id) {
      return;
    }

    const accountToSwitch = savedAccounts.find(
      (account) => account.id === accountId
    );

    if (!accountToSwitch) {
      return;
    }

    try {
      setSwitchingAccount(accountToSwitch);
      setIsAccountMenuOpen(false);
      setIsAccountSwitcherOpen(false);
      setIsLogoutMenuOpen(false);

      await sleep(650);

      const switchedUser = await switchAccount(accountId);

      await sleep(300);

      navigate(getDefaultRouteForRole(switchedUser.role));
    } catch (error) {
      console.error(error);
    } finally {
      setSwitchingAccount(null);
    }
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
        setIsLogoutMenuOpen(false);
      }
    }

    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsAccountSwitcherOpen(false);
        setIsLogoutMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isAccountMenuOpen]);

  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] || "Page Not Found";
  
  useEffect(() => {
    document.title = `${pageTitle} | CoreFlow`;
  }, [pageTitle]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <img src={appIcon} alt="CoreFlow logo" />
          </div>

          <div>
            <h2>CoreFlow</h2>
            <p>Operations Platform</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <p className="sidebar-nav-label">Command Centre</p>

            {isAdmin && (
              <NavLink to="/dashboard">
                <FiBarChart2 />
                <span>Dashboard</span>
              </NavLink>
            )}

            <NavLink to="/ai-analytics">
              <FiCpu />
              <span>AI Analytics</span>
            </NavLink>
          </div>

          <div className="sidebar-nav-section">
            <p className="sidebar-nav-label">Operations</p>

            <NavLink to="/products">
              <FiBox />
              <span>Products</span>
            </NavLink>

            <NavLink to="/inventory">
              <FiArchive />
              <span>Inventory</span>
            </NavLink>

            <NavLink to="/sales-orders">
              <FiShoppingCart />
              <span>Sales Orders</span>
            </NavLink>

            <NavLink to="/invoices">
              <FiFileText />
              <span>Invoices</span>
            </NavLink>
          </div>

          <div className="sidebar-nav-section">
            <p className="sidebar-nav-label">Relationships</p>

            <NavLink to="/customers">
              <FiUsers />
              <span>Customers</span>
            </NavLink>

            <NavLink to="/suppliers">
              <FiTruck />
              <span>Suppliers</span>
            </NavLink>

            <NavLink to="/purchase-orders">
              <FiShoppingBag />
              <span>Purchase Orders</span>
            </NavLink>
          </div>

          <div className="sidebar-nav-section">
            <p className="sidebar-nav-label">Security</p>

            <NavLink to="/approvals">
              <FiShield />
              <span>
                {user?.role === "Admin" ? "Approvals" : "Request Adjustment"}
              </span>
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
          </div>
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
                      onMouseEnter={() => setIsLogoutMenuOpen(false)}
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

                      {canUseAccountSwitcher && <FiChevronRight />}
                    </button>

                    {canUseAccountSwitcher && isAccountSwitcherOpen && (
                      <div className="account-switcher-menu">
                        {savedAccounts.map((account) => {
                          const isActiveAccount = account.id === user.id;

                          return (
                            <button
                              key={account.id}
                              type="button"
                              className={`account-switcher-account ${
                                isActiveAccount ? "account-switcher-account-active" : ""
                              }`}
                              onClick={() => handleSwitchAccount(account.id)}
                            >
                              <div className="user-avatar">
                                {account.name?.charAt(0).toUpperCase()}
                              </div>

                              <div className="account-menu-text">
                                <strong>{account.name}</strong>
                                <span>{account.email}</span>
                              </div>

                              {isActiveAccount && <FiCheck className="account-check-icon" />}
                            </button>
                          );
                        })}

                        {isAdmin && (
                          <>
                            <div className="account-menu-divider" />

                            <button
                              type="button"
                              className="account-switcher-add"
                              onClick={handleAddAnotherAccount}
                            >
                              <FiPlusCircle />
                              <span>Add another account</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="account-menu-divider" />

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    onMouseEnter={handleCloseSideMenus}
                  >
                    <FiUser />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    disabled
                    onMouseEnter={handleCloseSideMenus}
                  >
                    <FiSettings />
                    <span>Settings</span>
                    <small>Soon</small>
                  </button>

                  <div className="account-menu-divider" />

                  <div className="account-menu-logout-row-wrapper">
                    <button
                      type="button"
                      onClick={handleToggleLogoutMenu}
                      onMouseEnter={() => {
                        setIsAccountSwitcherOpen(false);
                      }}
                      className={`account-menu-danger ${
                        isLogoutMenuOpen ? "account-menu-logout-row-active" : ""
                      }`}
                    >
                      <FiLogOut />
                      <span>Logout</span>

                      {savedAccounts.length > 1 && (
                        <FiChevronRight className="account-menu-row-arrow" />
                      )}
                    </button>

                    {isLogoutMenuOpen && savedAccounts.length > 1 && (
                      <div className="account-logout-menu">
                        {savedAccounts.map((account) => {
                          const isActiveAccount = account.id === user.id;

                          return (
                            <button
                              key={account.id}
                              type="button"
                              className="account-logout-option"
                              onClick={() => handleLogoutSavedAccount(account.id)}
                            >
                              <div className="user-avatar">
                                {account.name?.charAt(0).toUpperCase()}
                              </div>

                              <div className="account-menu-text">
                                <strong>{account.name}</strong>
                                <span>{account.email}</span>
                              </div>

                              <small>{isActiveAccount ? "Active" : "Sign out"}</small>
                            </button>
                          );
                        })}

                        <div className="account-menu-divider" />

                        <button
                          type="button"
                          className="account-logout-all"
                          onClick={handleLogout}
                        >
                          <FiLogOut />
                          <span>Sign out all accounts</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="content-shell">
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {switchingAccount && (
        <div className="account-switch-feedback" role="status" aria-live="polite">
          <div className="account-switch-feedback-card">
            <div className="account-switch-spinner" />

            <div>
              <strong>
                {switchingAccount.switchingMessage ||
                  `Switching to ${switchingAccount.name}`}
              </strong>
              <p>{switchingAccount.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppLayout;