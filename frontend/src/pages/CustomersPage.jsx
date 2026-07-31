import { useEffect, useState } from "react";
import {
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";
import ConfirmModal from "../components/ConfirmModal";

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

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage customer records, contact details, and customer history.</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={handleExportCustomers}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button type="button" onClick={handleOpenCreateForm}>
            + New Customer
          </button>
        </div>
      </div>

      {exportError && <p className="message error-message">{exportError}</p>}
      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      {isCustomerFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card customer-form-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingCustomerId ? "Edit Customer" : "Create Customer"}
                </h2>
                <p>
                  {editingCustomerId
                    ? "Update an existing customer record."
                    : "Add a new customer to the ERP system."}
                </p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseCustomerForm}
                aria-label="Close customer form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="form-grid">
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

              <div className="form-field full-width">
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
                <p className="message error-message full-width">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingCustomerId
                      ? "Updating..."
                      : "Creating..."
                    : editingCustomerId
                    ? "Update Customer"
                    : "Create Customer"}
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

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Customer Directory</h2>
            <p>
              {loading
                ? "Loading customers..."
                : `Showing ${displayedCustomers.length} of ${customers.length} customers.`}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCustomers}
            className="secondary-button"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="table-toolbar customers-table-toolbar">
          <div className="toolbar-input-with-icon">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, phone, or address..."
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
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {hasActiveCustomerFilters && (
            <button
              type="button"
              onClick={resetCustomerFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {deleteError && <p className="message error-message">{deleteError}</p>}

          {loading ? (
            <p>Loading customers...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchCustomers}>
                Try Again
              </button>
            </div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <FiUsers />
              <h3>No customers found</h3>
              <p>Create your first customer using the New Customer button.</p>
            </div>
          ) : displayedCustomers.length === 0 ? (
            <div className="empty-state">
              <FiSearch />
              <h3>No matching customers found</h3>
              <p>Try changing your search or sort option.</p>

              <button
                type="button"
                onClick={resetCustomerFilters}
                className="secondary-button"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Created At</th>
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
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => handleEditCustomer(customer)}
                            className="secondary-button"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(customer)}
                            disabled={deletingCustomerId === customer.id}
                            className="danger-button"
                          >
                            {deletingCustomerId === customer.id
                              ? "Deleting..."
                              : "Delete"}
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
      </div>

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