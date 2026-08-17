import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";
import "../styles/invoices.css";

const initialFormData = {
  sales_order_id: "",
};

const paymentStatusOptions = ["pending", "paid", "failed", "cancelled", "refunded"];

function InvoicesPage() {
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

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
      setInvoices(response.data?.data?.invoices || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSalesOrders() {
    try {
      const response = await apiClient.get("/sales-orders");
      setSalesOrders(response.data?.data?.salesOrders || []);
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
      setSelectedInvoice(response.data?.data?.invoice || null);
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

  function handleOpenInvoiceForm() {
    setFormData(initialFormData);
    setCreateError("");
    setSuccessMessage("");
    setIsInvoiceFormOpen(true);
  }

  function handleCloseInvoiceForm() {
    setFormData(initialFormData);
    setCreateError("");
    setIsInvoiceFormOpen(false);
  }

  async function handleGenerateInvoice(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setUpdateError("");
      setDetailError("");
      setSuccessMessage("");

      if (!formData.sales_order_id) {
        setCreateError("Please select a sales order.");
        setCreating(false);
        return;
      }

      const invoiceData = {
        sales_order_id: Number(formData.sales_order_id),
      };

      await apiClient.post("/invoices", invoiceData);

      setFormData(initialFormData);
      setIsInvoiceFormOpen(false);
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

      setSelectedStatuses((previousStatuses) => {
        const updatedStatuses = { ...previousStatuses };
        delete updatedStatuses[invoice.id];
        return updatedStatuses;
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

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString();
  }

  function formatStatus(status) {
    if (!status) {
      return "-";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getStatusBadgeClass(status) {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus === "paid") {
      return "badge badge-success";
    }

    if (normalizedStatus === "pending") {
      return "badge badge-warning";
    }

    if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
      return "badge badge-danger";
    }

    if (normalizedStatus === "refunded") {
      return "badge badge-info";
    }

    return "badge badge-info";
  }

  function getAllowedPaymentStatusOptions(invoice) {
    const currentStatus = invoice.status;

    if (currentStatus === "pending") {
      return ["pending", "paid", "failed", "cancelled"];
    }

    if (currentStatus === "paid") {
      return ["paid", "refunded"];
    }

    if (currentStatus === "failed") {
      return ["failed", "pending", "paid", "cancelled"];
    }

    if (currentStatus === "cancelled") {
      return ["cancelled"];
    }

    if (currentStatus === "refunded") {
      return ["refunded"];
    }

    return paymentStatusOptions;
  }

  const availableSalesOrders = salesOrders.filter((order) => {
    return !invoices.some((invoice) => {
      return Number(invoice.sales_order_id) === Number(order.id);
    });
  });

  const totalInvoices = invoices.length;

  const paidInvoices = invoices.filter((invoice) => {
    return invoice.status === "paid";
  });

  const pendingInvoices = invoices.filter((invoice) => {
    return invoice.status === "pending";
  });

  const failedOrCancelledInvoices = invoices.filter((invoice) => {
    return invoice.status === "failed" || invoice.status === "cancelled";
  });

  const totalInvoiceValue = invoices.reduce((total, invoice) => {
    return total + Number(invoice.total_amount || 0);
  }, 0);

  const paidRevenue = paidInvoices.reduce((total, invoice) => {
    return total + Number(invoice.total_amount || 0);
  }, 0);

  const pendingAmount = pendingInvoices.reduce((total, invoice) => {
    return total + Number(invoice.total_amount || 0);
  }, 0);

  const latestInvoice = [...invoices].sort((a, b) => {
    return new Date(b.issued_at) - new Date(a.issued_at);
  })[0];

  const displayedInvoices = invoices
    .filter((invoice) => {
      const searchableText = `${invoice.invoice_number} ${
        invoice.sales_order_id
      } ${invoice.customer_name} ${invoice.status}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.issued_at) - new Date(a.issued_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.issued_at) - new Date(b.issued_at);
      }

      if (sortOption === "total-desc") {
        return Number(b.total_amount || 0) - Number(a.total_amount || 0);
      }

      if (sortOption === "total-asc") {
        return Number(a.total_amount || 0) - Number(b.total_amount || 0);
      }

      if (sortOption === "customer-asc") {
        return String(a.customer_name || "").localeCompare(
          String(b.customer_name || "")
        );
      }

      return 0;
    });

  const hasActiveInvoiceFilters = searchQuery || statusFilter !== "all";

  function resetInvoiceFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOption("newest");
  }

  const isDetailModalOpen =
    detailLoading || Boolean(detailError) || Boolean(selectedInvoice);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>
            Generate invoices from sales orders, track payment status, and
            review invoice details.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" onClick={handleExportInvoices} disabled={exporting}>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button type="button" onClick={handleOpenInvoiceForm}>
            + Generate Invoice
          </button>
        </div>
      </div>

      {exportError && <p className="message error-message">{exportError}</p>}
      {updateError && <p className="message error-message">{updateError}</p>}
      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      {/* Invoice summary or metrics */}
      <div className="dashboard-metric-grid">
        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiFileText />
          </div>

          <div>
            <span>Total Invoices</span>
            <strong>{totalInvoices}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Paid Invoices</span>
            <strong>{paidInvoices.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Pending Amount</span>
            <strong>{formatCurrency(pendingAmount)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-red">
          <div className="metric-icon">
            <FiAlertCircle />
          </div>

          <div>
            <span>Failed/Cancelled</span>
            <strong>{failedOrCancelledInvoices.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Paid Revenue</span>
            <strong>{formatCurrency(paidRevenue)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-purple">
          <div className="metric-icon">
            <FiCreditCard />
          </div>

          <div>
            <span>Total Invoice Value</span>
            <strong>{formatCurrency(totalInvoiceValue)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest Invoice</span>
            <strong>
              {latestInvoice ? formatShortDate(latestInvoice.issued_at) : "-"}
            </strong>
          </div>
        </article>
      </div>

      {/* Invoice Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>All Invoices</h2>
            <p>
              {loading
                ? "Loading invoices..."
                : `Showing ${displayedInvoices.length} of ${invoices.length} invoices.`}
            </p>
          </div>
        </div>

        {/* Table toolbar */}
        <div className="table-toolbar invoice-table-toolbar">
          <input
            type="text"
            placeholder="Search by invoice, sales order, customer, or status..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search invoices"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter invoices by payment status"
          >
            <option value="all">All Statuses</option>
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort invoices"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total-desc">Total High-Low</option>
            <option value="total-asc">Total Low-High</option>
            <option value="customer-asc">Customer A-Z</option>
          </select>

          {hasActiveInvoiceFilters && (
            <button
              type="button"
              onClick={resetInvoiceFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>
        
        {/* Table informations */}
        <div className="panel-body">
          {loading ? (
            <p>Loading invoices...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchInvoices}>
                Try Again
              </button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <h3>No invoices found</h3>
              <p>Generate the first invoice using the button above.</p>
            </div>
          ) : displayedInvoices.length === 0 ? (
            <div className="empty-state">
              <h3>No matching invoices found</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetInvoiceFilters}
                className="secondary-button"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Sales Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Issued At</th>
                    <th>Payment Update</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedInvoices.map((invoice) => {
                    const selectedStatus = selectedStatuses[invoice.id] || invoice.status;
                    const isStatusUnchanged = selectedStatus === invoice.status;

                    return (
                      <tr key={invoice.id}>
                        <td>
                          <span className="code-pill">
                            {invoice.invoice_number}
                          </span>
                        </td>

                        <td>
                          <span className="code-pill">
                            SO-{String(invoice.sales_order_id).padStart(4, "0")}
                          </span>
                        </td>

                        <td>
                          <strong>{invoice.customer_name}</strong>
                        </td>

                        <td>
                          <span className={getStatusBadgeClass(invoice.status)}>
                            {formatStatus(invoice.status)}
                          </span>
                        </td>

                        <td>
                          <strong>{formatCurrency(invoice.total_amount)}</strong>
                        </td>

                        <td>{formatDate(invoice.issued_at)}</td>

                        <td>
                          <div className="payment-update-control">
                            <select
                              value={selectedStatus}
                              onChange={(event) =>
                                handleStatusChange(invoice.id, event.target.value)
                              }
                            >
                              {getAllowedPaymentStatusOptions(invoice).map((status) => (
                                <option key={status} value={status}>
                                  {formatStatus(status)}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentStatus(invoice)}
                              disabled={updatingInvoiceId === invoice.id || isStatusUnchanged}
                              className="secondary-button"
                            >
                              {updatingInvoiceId === invoice.id
                                ? "Updating..."
                                : "Update"}
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              onClick={() => fetchInvoiceDetails(invoice.id)}
                              className="secondary-button"
                            >
                              <FiEye />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {isInvoiceFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card invoice-form-modal">
            <div className="modal-header">
              <div>
                <h2>Generate Invoice</h2>
                <p>Select a sales order that does not already have an invoice.</p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseInvoiceForm}
                aria-label="Close invoice form"
              >
                <FiX />
              </button>
            </div>

            {availableSalesOrders.length === 0 ? (
              <div className="empty-state">
                <FiFileText />
                <h3>No sales orders available</h3>
                <p>Every current sales order already has an invoice.</p>
              </div>
            ) : (
              <form onSubmit={handleGenerateInvoice} className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="sales_order_id">Sales Order</label>
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
                        SO-{String(order.id).padStart(4, "0")} —{" "}
                        {order.customer_name} — {formatCurrency(order.total_amount)}
                      </option>
                    ))}
                  </select>
                </div>

                {createError && (
                  <p className="message error-message full-width">
                    {createError}
                  </p>
                )}

                <div className="form-actions">
                  <button type="submit" disabled={creating}>
                    {creating ? "Generating..." : "Generate Invoice"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseInvoiceForm}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Invoice details modal */}
      {isDetailModalOpen && (
        <div className="modal-backdrop">
          <section className="modal-card invoice-detail-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {selectedInvoice
                    ? selectedInvoice.invoice_number
                    : "Invoice Details"}
                </h2>
                <p>Review customer, payment status, totals, and line items.</p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseDetails}
                aria-label="Close invoice details"
              >
                <FiX />
              </button>
            </div>

            {detailLoading ? (
              <p>Loading invoice details...</p>
            ) : detailError ? (
              <p className="message error-message">{detailError}</p>
            ) : (
              selectedInvoice && (
                <>
                  <div className="detail-summary-grid">
                    <article className="detail-summary-card">
                      <span>Customer</span>
                      <strong>{selectedInvoice.customer_name}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Sales Order</span>
                      <strong>
                        SO-
                        {String(selectedInvoice.sales_order_id).padStart(
                          4,
                          "0"
                        )}
                      </strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Status</span>
                      <strong>
                        <span
                          className={getStatusBadgeClass(selectedInvoice.status)}
                        >
                          {formatStatus(selectedInvoice.status)}
                        </span>
                      </strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Issued At</span>
                      <strong>{formatDate(selectedInvoice.issued_at)}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Subtotal</span>
                      <strong>{formatCurrency(selectedInvoice.subtotal)}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>GST</span>
                      <strong>{formatCurrency(selectedInvoice.gst_amount)}</strong>
                    </article>

                    <article className="detail-summary-card detail-total-card">
                      <span>Total</span>
                      <strong>{formatCurrency(selectedInvoice.total_amount)}</strong>
                    </article>
                  </div>

                  <h3>Line Items</h3>

                  {(selectedInvoice.items || []).length === 0 ? (
                    <p>No line items found.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table>
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
                              <td>
                                <strong>{item.product_name}</strong>
                              </td>
                              <td>
                                <span className="code-pill">{item.sku}</span>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td>
                                <strong>{formatCurrency(item.line_total)}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default InvoicesPage;