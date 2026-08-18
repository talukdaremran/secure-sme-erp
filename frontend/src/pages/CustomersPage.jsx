import { useEffect, useState } from "react";
import {
  FiDownload,
  FiEdit2,
  FiFilter,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/customers.css";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

function CustomersPage() {
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/customers");
      setCustomers(response.data?.data?.customers || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleOpenCreateForm() {
    setEditingCustomerId(null);
    setFormData(initialFormData);
    setFormError("");
    setDeleteError("");
    setSuccessMessage("");
    setIsCustomerFormOpen(true);
  }

  function handleEditCustomer(customer) {
    setEditingCustomerId(customer.id);
    setFormError("");
    setDeleteError("");
    setSuccessMessage("");

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });

    setIsCustomerFormOpen(true);
  }

  function handleCloseCustomerForm() {
    setEditingCustomerId(null);
    setFormData(initialFormData);
    setFormError("");
    setIsCustomerFormOpen(false);
  }

  async function handleSubmitCustomer(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      const customerData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      if (editingCustomerId) {
        await apiClient.put(`/customers/${editingCustomerId}`, customerData);
        setSuccessMessage("Customer updated successfully.");
      } else {
        await apiClient.post("/customers", customerData);
        setSuccessMessage("Customer created successfully.");
      }

      setFormData(initialFormData);
      setEditingCustomerId(null);
      setIsCustomerFormOpen(false);

      await fetchCustomers();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          `Failed to ${editingCustomerId ? "update" : "create"} customer.`
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteCustomer(customer) {
    setCustomerToDelete(customer);
  }

  async function confirmDeleteCustomer() {
    if (!customerToDelete) {
      return;
    }

    try {
      setDeletingCustomerId(customerToDelete.id);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      await apiClient.delete(`/customers/${customerToDelete.id}`);

      if (editingCustomerId === customerToDelete.id) {
        setEditingCustomerId(null);
        setFormData(initialFormData);
        setIsCustomerFormOpen(false);
      }

      setSuccessMessage("Customer deleted successfully.");
      setCustomerToDelete(null);

      await fetchCustomers();
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Failed to delete customer."
      );
    } finally {
      setDeletingCustomerId(null);
    }
  }

  async function handleExportCustomers() {
    try {
      setExporting(true);
      setExportError("");
      setSuccessMessage("");

      await exportCSV("/exports/customers", "customers.csv");

      setSuccessMessage("Customers CSV exported successfully.");
    } catch (error) {
      setExportError("Failed to export customers CSV.");
    } finally {
      setExporting(false);
    }
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString();
  }

  function getInitials(name) {
    if (!name) {
      return "C";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  const displayedCustomers = customers
    .filter((customer) => {
      const searchableText = `${customer.name || ""} ${customer.email || ""} ${
        customer.phone || ""
      } ${customer.address || ""}`.toLowerCase();

      return searchableText.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortOption === "name-asc") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortOption === "name-desc") {
        return String(b.name || "").localeCompare(String(a.name || ""));
      }

      return 0;
    });

  const hasActiveCustomerFilters = searchQuery;

  function resetCustomerFilters() {
    setSearchQuery("");
    setSortOption("newest");
  }

  const totalCustomers = customers.length;

  const customersWithEmail = customers.filter((customer) => {
    return Boolean(customer.email);
  });

  const customersWithPhone = customers.filter((customer) => {
    return Boolean(customer.phone);
  });

  const customersWithAddress = customers.filter((customer) => {
    return Boolean(customer.address);
  });

  const completeContactRecords = customers.filter((customer) => {
    return Boolean(customer.email && customer.phone);
  });

  const latestCustomer = [...customers].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  return (
    <section className="customers-page">
      <header className="customers-command-bar">
        <div>
          <span className="customers-eyebrow">Customer records</span>
          <h1>Customers</h1>
          <p>
            Manage customer contact records used across sales orders, invoices,
            customer portal accounts, and customer activity analysis.
          </p>
        </div>

        <div className="customers-command-actions">
          <button
            type="button"
            className="customers-secondary-command"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="customers-secondary-command"
            onClick={handleExportCustomers}
            disabled={exporting}
          >
            <FiDownload />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            type="button"
            className="customers-primary-command"
            onClick={handleOpenCreateForm}
          >
            <FiPlus />
            New customer
          </button>
        </div>
      </header>

      {(exportError || successMessage || deleteError || error) && (
        <div className="customers-message-stack">
          {exportError && <p className="message error-message">{exportError}</p>}
          {deleteError && <p className="message error-message">{deleteError}</p>}
          {error && <p className="message error-message">{error}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="customers-kpi-strip" aria-label="Customer metrics">
        <article className="customers-kpi-card">
          <div className="customers-kpi-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total customers</span>
            <strong>{totalCustomers}</strong>
            <p>Directory records</p>
          </div>
        </article>

        <article className="customers-kpi-card">
          <div className="customers-kpi-icon">
            <FiMail />
          </div>

          <div>
            <span>Email records</span>
            <strong>{customersWithEmail.length}</strong>
            <p>Customers with email</p>
          </div>
        </article>

        <article className="customers-kpi-card">
          <div className="customers-kpi-icon">
            <FiPhone />
          </div>

          <div>
            <span>Phone records</span>
            <strong>{customersWithPhone.length}</strong>
            <p>Customers with phone</p>
          </div>
        </article>

        <article className="customers-kpi-card">
          <div className="customers-kpi-icon">
            <FiMapPin />
          </div>

          <div>
            <span>Address records</span>
            <strong>{customersWithAddress.length}</strong>
            <p>Customers with address</p>
          </div>
        </article>

        <article className="customers-kpi-card success">
          <div className="customers-kpi-icon">
            <FiUsers />
          </div>

          <div>
            <span>Complete contacts</span>
            <strong>{completeContactRecords.length}</strong>
            <p>Email and phone</p>
          </div>
        </article>

        <article className="customers-kpi-card">
          <div className="customers-kpi-icon">
            <FiRefreshCw />
          </div>

          <div>
            <span>Latest customer</span>
            <strong>{latestCustomer ? formatShortDate(latestCustomer.created_at) : "-"}</strong>
            <p>Most recent record</p>
          </div>
        </article>
      </section>

      <section className="customers-workspace">
        <div className="customers-workspace-header">
          <div>
            <span>Customer directory</span>
            <h2>Customer records</h2>
            <p>
              {loading
                ? "Loading customers..."
                : `Showing ${displayedCustomers.length} of ${customers.length} customers.`}
            </p>
          </div>
        </div>

        <div className="customers-toolbar">
          <div className="customers-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, phone, or address"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search customers"
            />
          </div>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort customers"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {hasActiveCustomerFilters && (
            <button
              type="button"
              onClick={resetCustomerFilters}
              className="customers-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="customers-table-area">
          {loading ? (
            <div className="customers-empty-state">
              <FiUsers />
              <h3>Loading customers</h3>
              <p>Please wait while customer records are loaded.</p>
            </div>
          ) : error ? (
            <div className="customers-empty-state">
              <FiUsers />
              <h3>Could not load customers</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchCustomers}
                className="customers-primary-command"
              >
                Try again
              </button>
            </div>
          ) : customers.length === 0 ? (
            <div className="customers-empty-state">
              <FiUsers />
              <h3>No customers found</h3>
              <p>Create your first customer using the command bar above.</p>

              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="customers-primary-command"
              >
                <FiPlus />
                New customer
              </button>
            </div>
          ) : displayedCustomers.length === 0 ? (
            <div className="customers-empty-state">
              <FiSearch />
              <h3>No matching customers</h3>
              <p>Try changing your search or sort option.</p>

              <button
                type="button"
                onClick={resetCustomerFilters}
                className="customers-secondary-command"
              >
                Reset search
              </button>
            </div>
          ) : (
            <div className="customers-table-wrapper">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Created at</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar">
                            {getInitials(customer.name)}
                          </span>

                          <strong>{customer.name}</strong>
                        </div>
                      </td>

                      <td>{customer.email || "-"}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>{customer.address || "-"}</td>
                      <td>{formatDate(customer.created_at)}</td>

                      <td>
                        <div className="customers-table-actions">
                          <button
                            type="button"
                            onClick={() => handleEditCustomer(customer)}
                            className="customers-icon-action"
                          >
                            <FiEdit2 />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(customer)}
                            disabled={deletingCustomerId === customer.id}
                            className="customers-icon-action danger"
                          >
                            <FiTrash2 />
                            <span>
                              {deletingCustomerId === customer.id
                                ? "Deleting"
                                : "Delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {isCustomerFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card customer-form-modal">
            <div className="customers-modal-header">
              <div>
                <span>Customer record</span>
                <h2>{editingCustomerId ? "Edit customer" : "Create customer"}</h2>
                <p>
                  {editingCustomerId
                    ? "Update an existing customer record."
                    : "Add a new customer to the ERP customer directory."}
                </p>
              </div>

              <button
                type="button"
                className="customers-icon-button"
                onClick={handleCloseCustomerForm}
                aria-label="Close customer form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="customers-form-grid">
              <div className="form-field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field customers-form-full">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              {formError && (
                <p className="message error-message customers-form-full">
                  {formError}
                </p>
              )}

              <div className="customers-form-actions customers-form-full">
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingCustomerId
                      ? "Updating..."
                      : "Creating..."
                    : editingCustomerId
                    ? "Update customer"
                    : "Create customer"}
                </button>

                <button
                  type="button"
                  onClick={handleCloseCustomerForm}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        title="Delete customer?"
        message={
          customerToDelete
            ? `Are you sure you want to delete "${customerToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Customer"
        isLoading={deletingCustomerId === customerToDelete?.id}
        onConfirm={confirmDeleteCustomer}
        onCancel={() => setCustomerToDelete(null)}
      />
    </section>
  );
}

export default CustomersPage;
