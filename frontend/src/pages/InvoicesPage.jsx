import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Invoices</h1>
        <p>Loading invoices...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Invoices</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchInvoices}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Invoices</h1>

      {invoices.length === 0 ? (
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
                <td>${Number(invoice.subtotal).toFixed(2)}</td>
                <td>${Number(invoice.gst_amount).toFixed(2)}</td>
                <td>${Number(invoice.total_amount).toFixed(2)}</td>
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