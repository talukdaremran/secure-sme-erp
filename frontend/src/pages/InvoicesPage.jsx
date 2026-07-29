import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const initialFormData = {
  sales_order_id: "",
};

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchInvoices() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/invoices");
      setInvoices(response.data.data.invoices);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSalesOrders() {
    try {
      const response = await apiClient.get("/sales-orders");
      setSalesOrders(response.data.data.salesOrders);
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to load sales order options."
      );
    }
  }

  useEffect(() => {
    fetchInvoices();
    fetchSalesOrders();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleGenerateInvoice(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setSuccessMessage("");

      const invoiceData = {
        sales_order_id: Number(formData.sales_order_id),
      };

      await apiClient.post("/invoices", invoiceData);

      setFormData(initialFormData);
      setSuccessMessage("Invoice generated successfully.");

      await fetchInvoices();
      await fetchSalesOrders();
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to generate invoice."
      );
    } finally {
      setCreating(false);
    }
  }

  const availableSalesOrders = salesOrders.filter((order) => {
    return !invoices.some((invoice) => {
      return Number(invoice.sales_order_id) === Number(order.id);
    });
  });

  return (
    <section>
      <h1>Invoices</h1>

      <section>
        <h2>Generate Invoice</h2>

        <form onSubmit={handleGenerateInvoice}>
          <div>
            <label htmlFor="sales_order_id">Sales Order</label>
            <br />
            <select
              id="sales_order_id"
              name="sales_order_id"
              value={formData.sales_order_id}
              onChange={handleChange}
              required
            >
              <option value="">Select sales order</option>
              {availableSalesOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Order #{order.id} — {order.customer_name} — $
                  {Number(order.total_amount || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {availableSalesOrders.length === 0 && (
            <p>No available sales orders to invoice.</p>
          )}

          {createError && <p>{createError}</p>}
          {successMessage && <p>{successMessage}</p>}

          <button
            type="submit"
            disabled={creating || availableSalesOrders.length === 0}
          >
            {creating ? "Generating..." : "Generate Invoice"}
          </button>
        </form>
      </section>

      <hr />

      <h2>Invoice List</h2>

      {loading ? (
        <p>Loading invoices...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <button type="button" onClick={fetchInvoices}>
            Try again
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Invoice Number</th>
              <th>Sales Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>GST</th>
              <th>Total</th>
              <th>Issued At</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.sales_order_id}</td>
                <td>{invoice.customer_name}</td>
                <td>{invoice.status}</td>
                <td>${Number(invoice.subtotal || 0).toFixed(2)}</td>
                <td>${Number(invoice.gst_amount || 0).toFixed(2)}</td>
                <td>${Number(invoice.total_amount || 0).toFixed(2)}</td>
                <td>{new Date(invoice.issued_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default InvoicesPage;