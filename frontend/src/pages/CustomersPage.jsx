import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

function CustomersPage() {
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

  async function handleDeleteCustomer(customer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCustomerId(customer.id);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      await apiClient.delete(`/customers/${customer.id}`);

      if (editingCustomerId === customer.id) {
        setEditingCustomerId(null);
        setFormData(initialFormData);
      }

      setSuccessMessage("Customer deleted successfully.");

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
      <h1>Customers</h1>

      <button type="button" onClick={handleExportCustomers} disabled={exporting}>
        {exporting ? "Exporting..." : "Export Customers CSV"}
      </button>

      {exportError && <p>{exportError}</p>}

      <section>
        <h2>{editingCustomerId ? "Edit Customer" : "Create Customer"}</h2>

        <form onSubmit={handleSubmitCustomer}>
          <div>
            <label htmlFor="name">Name</label>
            <br />
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <br />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="phone">Phone</label>
            <br />
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="address">Address</label>
            <br />
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {formError && <p>{formError}</p>}
          {successMessage && <p>{successMessage}</p>}

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
            <button type="button" onClick={handleCancelEdit}>
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      <hr />

      <h2>Customer List</h2>

      {deleteError && <p>{deleteError}</p>}

      {loading ? (
        <p>Loading customers...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <button type="button" onClick={fetchCustomers}>
            Try again
          </button>
        </div>
      ) : customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <table border="1" cellPadding="8">
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
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(customer)}
                    disabled={deletingCustomerId === customer.id}
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
      )}
    </section>
  );
}

export default CustomersPage;