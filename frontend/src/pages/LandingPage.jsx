import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiLock,
  FiShield,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";

import "../styles/landing.css";

const portalCards = [
  {
    title: "Staff / Admin Portal",
    label: "Internal ERP",
    description:
      "Manage products, customers, sales orders, inventory, invoices, approvals, procurement, audit logs, and business intelligence.",
    to: "/login",
    icon: FiBriefcase,
    action: "Enter ERP",
  },
  {
    title: "Customer Portal",
    label: "Ordering",
    description:
      "Browse available products, build a cart, place orders, and track fulfilment progress through a dedicated customer workspace.",
    to: "/customer/login",
    icon: FiShoppingCart,
    action: "Open Customer Portal",
  },
  {
    title: "Supplier Portal",
    label: "Procurement",
    description:
      "Review assigned purchase orders, confirm supplier delivery, and allow staff to complete receiving before stock is updated.",
    to: "/supplier/login",
    icon: FiTruck,
    action: "Open Supplier Portal",
  },
];

function LandingPage() {
  useEffect(() => {
    document.title = "CoreFlow | Portal Access";
  }, []);

  return (
    <section className="landing-page">
      <div className="landing-shell">
        <header className="landing-topbar">
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <FiShield />
            </div>

            <div>
              <strong>CoreFlow</strong>
              <span>Operations Platform</span>
            </div>
          </div>

          <div className="landing-security-pill">
            <FiLock />
            Secure role-based access
          </div>
        </header>

        <main className="landing-hero-grid">
          <section className="landing-hero">
            <span className="landing-eyebrow">
              AI-Powered SME ERP with Business Intelligence
            </span>

            <h1>One platform for operations, ordering, and procurement.</h1>

            <p>
              CoreFlow connects internal staff, customers, and suppliers through
              separate role-based portals while keeping business activity,
              approvals, inventory movements, and audit trails inside one ERP
              system.
            </p>

            <div className="landing-hero-actions">
              <Link to="/login" className="landing-primary-action">
                Staff Login
                <FiArrowRight />
              </Link>

              <a href="#portal-selection" className="landing-secondary-action">
                View Portals
              </a>
            </div>
          </section>

          <aside className="landing-system-card">
            <div className="landing-system-card-header">
              <div>
                <span>System Snapshot</span>
                <h2>Capstone Demo Ready</h2>
              </div>

              <FiActivity />
            </div>

            <div className="landing-feature-list">
              <article>
                <FiBarChart2 />
                <div>
                  <strong>Business Intelligence</strong>
                  <p>Dashboard insights, sales trends, and operational metrics.</p>
                </div>
              </article>

              <article>
                <FiShield />
                <div>
                  <strong>Security Controls</strong>
                  <p>Authentication, RBAC, audit logs, and anomaly detection.</p>
                </div>
              </article>

              <article>
                <FiCheckCircle />
                <div>
                  <strong>Controlled Workflows</strong>
                  <p>Orders, approvals, procurement, delivery, and receiving.</p>
                </div>
              </article>
            </div>
          </aside>
        </main>

        <section id="portal-selection" className="landing-portal-section">
          <div className="landing-section-header">
            <span>Portal Access</span>
            <h2>Choose your workspace</h2>
            <p>
              Each portal has a separate purpose, user role, and workflow.
            </p>
          </div>

          <div className="landing-card-grid">
            {portalCards.map((portal) => {
              const Icon = portal.icon;

              return (
                <Link key={portal.to} to={portal.to} className="landing-card">
                  <div className="landing-card-top">
                    <div className="landing-card-icon">
                      <Icon />
                    </div>

                    <span>{portal.label}</span>
                  </div>

                  <h3>{portal.title}</h3>
                  <p>{portal.description}</p>

                  <div className="landing-card-action">
                    {portal.action}
                    <FiArrowRight />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="landing-footer">
          <span>CoreFlow</span>
          <p>Secure SME ERP · BI Dashboard · AI Analytics · Portal Workflows</p>
        </footer>
      </div>
    </section>
  );
}

export default LandingPage;