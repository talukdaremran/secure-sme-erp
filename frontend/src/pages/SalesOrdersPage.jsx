import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchSalesOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/sales-orders");
      setSalesOrders(response.data.data.salesOrders);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load sales orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Sales Orders</h1>
        <p>Loading sales orders...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Sales Orders</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchSalesOrders}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Sales Orders</h1>

      {salesOrders.length === 0 ? (
        <p>No sales orders found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Created By</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>GST</th>
              <th>Total</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {salesOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer_name}</td>
                <td>{order.created_by_name || "-"}</td>
                <td>{order.status}</td>
                <td>${Number(order.subtotal).toFixed(2)}</td>
                <td>${Number(order.gst_amount).toFixed(2)}</td>
                <td>${Number(order.total_amount).toFixed(2)}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default SalesOrdersPage;