import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiClipboard,
  FiDatabase,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiTruck,
  FiUsers,
} from "react-icons/fi";

import "../styles/landing.css";

const portalCards = [
  {
    title: "Staff / Admin Portal",
    description:
      "Run products, customers, orders, invoices, stock movements, approvals, procurement, and reporting from the internal ERP.",
    to: "/login",
    action: "Open staff portal",
    icon: FiClipboard,
  },
  {
    title: "Customer Portal",
    description:
      "Allow customers to browse products, add items to cart, place orders, and track fulfilment progress from a dedicated portal.",
    to: "/customer/login",
    action: "Open customer portal",
    icon: FiShoppingCart,
  },
  {
    title: "Supplier Portal",
    description:
      "Let suppliers review assigned purchase orders, confirm delivery, and support staff receiving before stock is updated.",
    to: "/supplier/login",
    action: "Open supplier portal",
    icon: FiTruck,
  },
];

const featureCards = [
  {
    title: "Business intelligence",
    description:
      "Track revenue, forecasted sales, customer activity, procurement status, and inventory risk from one operational dashboard.",
    icon: FiBarChart2,
  },
  {
    title: "Inventory and procurement",
    description:
      "Manage product stock, supplier purchase orders, receipt confirmation, and low-stock alerts for daily operations.",
    icon: FiBox,
  },
  {
    title: "Security and control",
    description:
      "Use role-based access, audit logs, approval workflows, and anomaly visibility to support safer business processes.",
    icon: FiShield,
  },
];

const workflowItems = [
  "Customer places order",
  "Staff confirms fulfilment",
  "Supplier delivers purchase order",
  "Staff receives stock",
  "Dashboard updates activity",
];

function LandingPage() {
  useEffect(() => {
    document.title = "CoreFlow | SME Operations Platform";
  }, []);

  return (
    <section className="landing-page">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            <FiDatabase />
          </div>

          <div>
            <strong>CoreFlow</strong>
            <span>SME Operations Platform</span>
          </div>
        </div>

        <nav className="landing-topnav" aria-label="Landing page sections">
          <a href="#capabilities">Capabilities</a>
          <a href="#portals">Portals</a>
          <a href="#security">Security</a>
        </nav>

        <div className="landing-topbar-actions">
          <Link to="/login" className="landing-topbar-link">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero-section">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">
              AI-powered SME ERP with business intelligence
            </span>

            <h1>Manage sales, stock, procurement, and insights in one secure workspace.</h1>

            <p>
              CoreFlow brings internal staff, customers, and suppliers into a
              connected business system with role-based portals, operational
              dashboards, audit trails, approvals, and AI-assisted analytics.
            </p>

            <div className="landing-hero-actions">
              <Link to="/login" className="landing-primary-action">
                Enter staff portal
                <FiArrowRight />
              </Link>

              <a href="#portals" className="landing-secondary-action">
                Explore portals
              </a>
            </div>

            <div className="landing-trust-row">
              <span>
                <FiCheckCircle />
                Role-based access
              </span>

              <span>
                <FiCheckCircle />
                Audit visibility
              </span>

              <span>
                <FiCheckCircle />
                AI analytics service
              </span>
            </div>
          </div>

          <div className="landing-product-preview" aria-label="CoreFlow dashboard preview">
            <div className="preview-window">
              <div className="preview-window-bar">
                <span />
                <span />
                <span />
              </div>

              <div className="preview-header">
                <div>
                  <small>Operations overview</small>
                  <strong>Business intelligence</strong>
                </div>

                <button type="button">
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>

              <div className="preview-kpi-grid">
                <article>
                  <span>Revenue</span>
                  <strong>$14.1k</strong>
                </article>

                <article>
                  <span>Forecast</span>
                  <strong>$13.3k</strong>
                </article>

                <article>
                  <span>Action queue</span>
                  <strong>28</strong>
                </article>
              </div>

              <div className="preview-dashboard-grid">
                <section className="preview-chart-card wide">
                  <div className="preview-card-title">
                    <span>Revenue trend</span>
                    <small>Last 30 days</small>
                  </div>

                  <div className="preview-line-chart">
                    <span className="line-point p1" />
                    <span className="line-point p2" />
                    <span className="line-point p3" />
                    <span className="line-point p4" />
                    <span className="line-point p5" />
                  </div>
                </section>

                <section className="preview-chart-card">
                  <div className="preview-card-title">
                    <span>Stock risk</span>
                    <small>Live</small>
                  </div>

                  <div className="preview-bars">
                    <span style={{ height: "64%" }} />
                    <span style={{ height: "38%" }} />
                    <span style={{ height: "78%" }} />
                  </div>
                </section>

                <section className="preview-chart-card">
                  <div className="preview-card-title">
                    <span>Approvals</span>
                    <small>Queue</small>
                  </div>

                  <div className="preview-list">
                    <span />
                    <span />
                    <span />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="landing-section">
          <div className="landing-section-header">
            <span>Capabilities</span>
            <h2>Built for practical SME operations.</h2>
            <p>
              The system focuses on day-to-day workflows a small or medium
              business needs to control orders, inventory, purchasing, users,
              and reporting.
            </p>
          </div>

          <div className="landing-feature-grid">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="landing-feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="portals" className="landing-section landing-portals-section">
          <div className="landing-section-header">
            <span>Portal access</span>
            <h2>Separate workspaces for each role.</h2>
            <p>
              Staff, customers, and suppliers access different portals, while the
              ERP keeps the business workflow connected behind the scenes.
            </p>
          </div>

          <div className="landing-portal-grid">
            {portalCards.map((portal) => {
              const Icon = portal.icon;

              return (
                <Link key={portal.to} to={portal.to} className="landing-portal-card">
                  <div className="portal-card-header">
                    <div className="portal-card-icon">
                      <Icon />
                    </div>

                    <FiArrowRight />
                  </div>

                  <h3>{portal.title}</h3>
                  <p>{portal.description}</p>

                  <span>{portal.action}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="landing-workflow-section">
          <div className="workflow-copy">
            <span>Connected workflow</span>
            <h2>From customer order to supplier receiving.</h2>
            <p>
              CoreFlow demonstrates how sales, fulfilment, procurement, stock,
              approval, and audit workflows can work together inside one system.
            </p>
          </div>

          <div className="workflow-steps">
            {workflowItems.map((item, index) => (
              <article key={item}>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <span>{item}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="security" className="landing-security-section">
          <div className="security-panel">
            <div className="security-icon">
              <FiLock />
            </div>

            <div>
              <span>Security and governance</span>
              <h2>Designed around controlled access and traceable activity.</h2>
              <p>
                The staff portal includes authentication, role-based access,
                audit logging, stock adjustment approvals, and AI-supported
                anomaly visibility for suspicious activity.
              </p>
            </div>
          </div>

          <div className="security-checklist">
            <article>
              <FiUsers />
              <strong>Admin and staff roles</strong>
            </article>

            <article>
              <FiShield />
              <strong>Approval controls</strong>
            </article>

            <article>
              <FiActivitySafe />
              <strong>Audit trail visibility</strong>
            </article>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>CoreFlow</strong>
          <span>Secure SME ERP · BI Dashboard · AI Analytics · Portal Workflows</span>
        </div>

        <Link to="/login">
          Continue to staff portal
          <FiArrowRight />
        </Link>
      </footer>
    </section>
  );
}

function FiActivitySafe(props) {
  return <FiShield {...props} />;
}

export default LandingPage;
