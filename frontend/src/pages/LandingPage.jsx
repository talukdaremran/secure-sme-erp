import { Link } from "react-router-dom";
import { FiBriefcase, FiShoppingCart, FiTruck } from "react-icons/fi";

import "../styles/landing.css";

function LandingPage() {
  return (
    <section className="landing-page">
      <div className="landing-hero">
        <span className="landing-eyebrow">Secure SME ERP</span>

        <h1>Choose your portal</h1>

        <p>
          Access the internal ERP system, customer ordering portal, or supplier
          purchase order portal from one place.
        </p>
      </div>

      <div className="landing-card-grid">
        <Link to="/login" className="landing-card">
          <div className="landing-card-icon">
            <FiBriefcase />
          </div>

          <div>
            <h2>Staff / Admin Portal</h2>
            <p>
              Manage products, customers, sales orders, inventory, invoices,
              approvals, procurement, and reports.
            </p>
          </div>
        </Link>

        <Link to="/customer/login" className="landing-card">
          <div className="landing-card-icon">
            <FiShoppingCart />
          </div>

          <div>
            <h2>Customer Portal</h2>
            <p>
              Browse products, place orders, and view order progress through the
              customer portal.
            </p>
          </div>
        </Link>

        <Link to="/supplier/login" className="landing-card">
          <div className="landing-card-icon">
            <FiTruck />
          </div>

          <div>
            <h2>Supplier Portal</h2>
            <p>
              View assigned purchase orders and update delivery progress for
              staff review.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default LandingPage;