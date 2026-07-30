import { useEffect, useState } from "react";
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
      setCustomers(response.data.data.customers);
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
  }

  function handleCancelEdit() {
    setEditingCustomerId(null);
    setFormData(initialFormData);
    setFormError("");
    setSuccessMessage("");
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

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage customer records, contact details, and customer history.</p>
        </div>

        <div className="page-actions">
          <button type="button" onClick={handleExportCustomers} disabled={exporting}>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {exportError && <p>{exportError}</p>}

      <section className="panel form-panel">
        <div className="panel-header">
          <h2>{editingCustomerId ? "Edit Customer" : "Create Customer"}</h2>
          <p>
            {editingCustomerId
              ? "Update an existing customer record."
              : "Add a new customer to the ERP system."}
          </p>
        </div>

        <div className="panel-body">
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

              {editingCustomerId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="secondary-button"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formError && <p className="message error-message">{formError}</p>}
            {successMessage && <p className="message badge-success">{successMessage}</p>}
          </form>
        </div>
      </section>
      

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Customer List</h2>
            <p>All registered customer records.</p>
          </div>
        </div>

        <div className="panel-body">
          {deleteError && <p className="message error-message">{deleteError}</p>}

          {loading ? (
            <p>Loading customers...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>
              <button type="button" onClick={fetchCustomers}>
                Try again
              </button>
            </div>
          ) : customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{customer.email || "-"}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>{customer.address || "-"}</td>
                      <td>
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