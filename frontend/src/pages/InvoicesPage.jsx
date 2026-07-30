import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";

const initialFormData = {
  sales_order_id: "",
};

const paymentStatusOptions = ["pending", "paid", "failed", "cancelled"];

function InvoicesPage() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [detailError, setDetailError] = useState("");
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

  async function fetchInvoiceDetails(invoiceId) {
    try {
      setDetailLoading(true);
      setDetailError("");
      setSelectedInvoice(null);

      const response = await apiClient.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data.data.invoice);
    } catch (error) {
      setDetailError(
        error.response?.data?.message || "Failed to load invoice details."
      );
    } finally {
      setDetailLoading(false);
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
      setDetailError("");
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
      setDetailError("");
      setSuccessMessage("");

      await apiClient.patch(`/invoices/${invoice.id}/payment-status`, {
        status: selectedStatus,
        payment_method: "manual",
      });

      setSuccessMessage("Invoice payment status updated successfully.");

      await fetchInvoices();

      if (selectedInvoice?.id === invoice.id) {
        await fetchInvoiceDetails(invoice.id);
      }
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || "Failed to update payment status."
      );
    } finally {
      setUpdatingInvoiceId(null);
    }
  }

  function handleCloseDetails() {
    setSelectedInvoice(null);
    setDetailError("");
  }

  const availableSalesOrders = salesOrders.filter((order) => {
    return !invoices.some((invoice) => {
      return Number(invoice.sales_order_id) === Number(order.id);
    });
  });

  async function handleExportInvoices() {
  try {
    setExporting(true);
    setExportError("");
    setSuccessMessage("");

    await exportCSV("/exports/invoices", "invoices.csv");

    setSuccessMessage("Invoices CSV exported successfully.");
  } catch (error) {
    setExportError("Failed to export invoices CSV.");
  } finally {
    setExporting(false);
  }
}

  return (
    <section>
      <h1>Invoices</h1>

      <button type="button" onClick={handleExportInvoices} disabled={exporting}>
        {exporting ? "Exporting..." : "Export Invoices CSV"}
      </button>

      {exportError && <p>{exportError}</p>}

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

      <section>
        <h2>Invoice Details</h2>

        {detailLoading && <p>Loading invoice details...</p>}

        {detailError && <p>{detailError}</p>}

        {!detailLoading && !detailError && !selectedInvoice && (
          <p>Select an invoice to view details.</p>
        )}

        {selectedInvoice && (
          <div>
            <button type="button" onClick={handleCloseDetails}>
              Close Details
            </button>

            <h3>{selectedInvoice.invoice_number}</h3>

            <p>Invoice ID: {selectedInvoice.id}</p>
            <p>Sales Order ID: {selectedInvoice.sales_order_id}</p>
            <p>Customer: {selectedInvoice.customer_name}</p>
            <p>Status: {selectedInvoice.status}</p>
            <p>
              Subtotal: ${Number(selectedInvoice.subtotal || 0).toFixed(2)}
            </p>
            <p>GST: ${Number(selectedInvoice.gst_amount || 0).toFixed(2)}</p>
            <p>Total: ${Number(selectedInvoice.total_amount || 0).toFixed(2)}</p>
            <p>
              Issued At: {new Date(selectedInvoice.issued_at).toLocaleString()}
            </p>

            <h4>Line Items</h4>

            {(selectedInvoice.items || []).length === 0 ? (
              <p>No line items found.</p>
            ) : (
              <table border="1" cellPadding="8">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {(selectedInvoice.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.sku}</td>
                      <td>{item.quantity}</td>
                      <td>${Number(item.unit_price || 0).toFixed(2)}</td>
                      <td>${Number(item.line_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
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
              <th>Update Status</th>
              <th>Actions</th>
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
                    {updatingInvoiceId === invoice.id
                      ? "Updating..."
                      : "Update"}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => fetchInvoiceDetails(invoice.id)}
                  >
                    View Details
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