import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/customers");
      setCustomers(response.data.data.customers);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Customers</h1>
        <p>Loading customers...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Customers</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchCustomers}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Customers</h1>

      {customers.length === 0 ? (
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