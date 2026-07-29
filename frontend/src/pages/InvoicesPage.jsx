import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const initialFormData = {
  sales_order_id: "",
};

const paymentStatusOptions = ["pending", "paid", "failed", "cancelled"];

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedStatuses, setSelectedStatuses] = useState({});

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null);

  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");
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

  function handleStatusChange(invoiceId, status) {
    setSelectedStatuses((previousStatuses) => ({
      ...previousStatuses,
      [invoiceId]: status,
    }));
  }

  async function handleGenerateInvoice(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setUpdateError("");
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

  async function handleUpdatePaymentStatus(invoice) {
    const selectedStatus = selectedStatuses[invoice.id] || invoice.status;

    try {
      setUpdatingInvoiceId(invoice.id);
      setCreateError("");
      setUpdateError("");
      setSuccessMessage("");

      await apiClient.patch(`/invoices/${invoice.id}/payment-status`, {
        status: selectedStatus,
        payment_method: "manual",
      });

      setSuccessMessage("Invoice payment status updated successfully.");

      await fetchInvoices();
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || "Failed to update payment status."
      );
    } finally {
      setUpdatingInvoiceId(null);
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

          <button
            type="submit"
            disabled={creating || availableSalesOrders.length === 0}
          >
            {creating ? "Generating..." : "Generate Invoice"}
          </button>
        </form>
      </section>

      <hr />

      {updateError && <p>{updateError}</p>}
      {successMessage && <p>{successMessage}</p>}

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
              <th>Update Status</th>
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
                <td>
                  <select
                    value={selectedStatuses[invoice.id] || invoice.status}
                    onChange={(event) =>
                      handleStatusChange(invoice.id, event.target.value)
                    }
                  >
                    {paymentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleUpdatePaymentStatus(invoice)}
                    disabled={updatingInvoiceId === invoice.id}
                  >
                    {updatingInvoiceId === invoice.id ? "Updating..." : "Update"}
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

export default InvoicesPage;