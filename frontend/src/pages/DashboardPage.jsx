import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboardSummary() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/dashboard/summary");

      const dashboardSummary = response.data.data.summary;

      setSummary({
        ...dashboardSummary,
        lowStockProducts: dashboardSummary.lowStockProducts || [],
        recentActivity: dashboardSummary.recentActivity || [],
      });
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load dashboard summary."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Dashboard</h1>
        <p>Loading dashboard summary...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Dashboard</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchDashboardSummary}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Dashboard</h1>

      <h2>Summary</h2>

      <div>
        <p>Total Products: {summary.totalProducts}</p>
        <p>Total Customers: {summary.totalCustomers}</p>
        <p>Total Sales Orders: {summary.totalSalesOrders}</p>
        <p>Total Invoices: {summary.totalInvoices}</p>
        <p>
          Total Paid Revenue: $
          {Number(summary.totalPaidRevenue || 0).toFixed(2)}
        </p>
        <p>Pending Invoices: {summary.pendingInvoices}</p>
      </div>

      <h2>Low Stock Products</h2>

      {summary.lowStockProducts.length === 0 ? (
        <p>No low-stock products found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Low Stock Level</th>
            </tr>
          </thead>

          <tbody>
            {summary.lowStockProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.stock_quantity}</td>
                <td>{product.low_stock_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Recent Activity</h2>

      {summary.recentActivity.length === 0 ? (
        <p>No recent activity found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Result</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {summary.recentActivity.map((activity) => (
              <tr key={activity.id}>
                <td>{activity.id}</td>
                <td>{activity.user_name || "-"}</td>
                <td>{activity.action}</td>
                <td>{activity.module}</td>
                <td>{activity.result}</td>
                <td>{new Date(activity.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default DashboardPage;