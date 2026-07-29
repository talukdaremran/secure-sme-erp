import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
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

  async function handleCreateCustomer(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setSuccessMessage("");

      const customerData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      await apiClient.post("/customers", customerData);

      setFormData(initialFormData);
      setSuccessMessage("Customer created successfully.");

      await fetchCustomers();
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to create customer."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <h1>Customers</h1>

      <section>
        <h2>Create Customer</h2>

        <form onSubmit={handleCreateCustomer}>
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

          {createError && <p>{createError}</p>}
          {successMessage && <p>{successMessage}</p>}

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Customer"}
          </button>
        </form>
      </section>

      <hr />

      <h2>Customer List</h2>

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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default CustomersPage;