import { useEffect, useState } from "react";
import {
  FiClock,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";
import "../styles/salesOrders.css";

const initialFormData = {
  customer_id: "",
  items: [
    {
      product_id: "",
      quantity: "",
    },
  ],
};

function SalesOrdersPage() {
  const [isSalesOrderFormOpen, setIsSalesOrderFormOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deliveringOrderId, setDeliveringOrderId] = useState(null);
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);

  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchSalesOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/sales-orders");
      setSalesOrders(response.data?.data?.salesOrders || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load sales orders."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchFormOptions() {
    try {
      const [customersResponse, productsResponse] = await Promise.all([
        apiClient.get("/customers"),
        apiClient.get("/products"),
      ]);

      setCustomers(customersResponse.data?.data?.customers || []);
      setProducts(productsResponse.data?.data?.products || []);
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to load form options."
      );
    }
  }

  async function fetchSalesOrderDetails(salesOrderId) {
    try {
      setDetailLoading(true);
      setDetailError("");
      setSelectedSalesOrder(null);

      const response = await apiClient.get(`/sales-orders/${salesOrderId}`);
      setSelectedSalesOrder(response.data?.data?.salesOrder || null);
    } catch (error) {
      setDetailError(
        error.response?.data?.message || "Failed to load sales order details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    fetchSalesOrders();
    fetchFormOptions();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleItemChange(index, field, value) {
    setFormData((previousData) => {
      const updatedItems = previousData.items.map((item, itemIndex) => {
        if (itemIndex === index) {
          return {
            ...item,
            [field]: value,
          };
        }

        return item;
      });

      return {
        ...previousData,
        items: updatedItems,
      };
    });
  }

  function handleAddItem() {
    setFormData((previousData) => ({
      ...previousData,
      items: [
        ...previousData.items,
        {
          product_id: "",
          quantity: "",
        },
      ],
    }));
  }

  function handleRemoveItem(index) {
    setFormData((previousData) => {
      const updatedItems = previousData.items.filter((item, itemIndex) => {
        return itemIndex !== index;
      });

      return {
        ...previousData,
        items:
          updatedItems.length > 0
            ? updatedItems
            : [{ product_id: "", quantity: "" }],
      };
    });
  }

  function handleOpenCreateSalesOrder() {
    setFormData(initialFormData);
    setCreateError("");
    setSuccessMessage("");
    setIsSalesOrderFormOpen(true);
  }

  function handleCloseCreateSalesOrder() {
    setFormData(initialFormData);
    setCreateError("");
    setIsSalesOrderFormOpen(false);
  }

  async function handleCreateSalesOrder(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setDetailError("");
      setSuccessMessage("");

      if (!formData.customer_id) {
        setCreateError("Please select a customer.");
        setCreating(false);
        return;
      }

      const cleanedItems = formData.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }));

      const hasInvalidItem = cleanedItems.some((item) => {
        return !item.product_id || !item.quantity || item.quantity <= 0;
      });

      if (hasInvalidItem) {
        setCreateError("Each line item must have a product and valid quantity.");
        setCreating(false);
        return;
      }

      const salesOrderData = {
        customer_id: Number(formData.customer_id),
        items: cleanedItems,
      };

      await apiClient.post("/sales-orders", salesOrderData);

      setFormData(initialFormData);
      setIsSalesOrderFormOpen(false);
      setSuccessMessage("Sales order created successfully.");

      await fetchSalesOrders();
      await fetchFormOptions();
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to create sales order."
      );
    } finally {
      setCreating(false);
    }
  }

  function handleCloseDetails() {
    setSelectedSalesOrder(null);
    setDetailError("");
  }

  async function handleExportSalesOrders() {
    try {
      setExporting(true);
      setExportError("");
      setSuccessMessage("");

      await exportCSV("/exports/sales-orders", "sales-orders.csv");

      setSuccessMessage("Sales orders CSV exported successfully.");
    } catch (error) {
      setExportError("Failed to export sales orders CSV.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeliverSalesOrder() {
    if (!deliveryConfirmOrder) {
      return;
    }

    const orderId = deliveryConfirmOrder.id;

    try {
      setDeliveringOrderId(orderId);
      setError("");
      setDetailError("");
      setSuccessMessage("");

      await apiClient.patch(`/sales-orders/${orderId}/deliver`);

      setSuccessMessage("Sales order delivered successfully. Stock has been updated.");
      setDeliveryConfirmOrder(null);

      await fetchSalesOrders();
      await fetchFormOptions();

      if (selectedSalesOrder?.id === orderId) {
        await fetchSalesOrderDetails(orderId);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to mark sales order as delivered."
      );
    } finally {
      setDeliveringOrderId(null);
    }
  }

  function handleOpenDeliveryConfirm(order) {
    setError("");
    setSuccessMessage("");
    setDeliveryConfirmOrder(order);
  }

  function handleCloseDeliveryConfirm() {
    if (deliveringOrderId) {
      return;
    }

    setDeliveryConfirmOrder(null);
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

    if (
      normalizedStatus === "confirmed" ||
      normalizedStatus === "paid" ||
      normalizedStatus === "delivered"
    ) {
      return "badge badge-success";
    }

    if (
      normalizedStatus === "pending" ||
      normalizedStatus === "placed" ||
      normalizedStatus === "draft"
    ) {
      return "badge badge-warning";
    }

    if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "failed" ||
      normalizedStatus === "rejected"
    ) {
      return "badge badge-danger";
    }

    return "badge badge-info";
  }

  function canDeliverOrder(order) {
    return String(order.status || "").toLowerCase() === "placed";
  }

  const totalOrders = salesOrders.length;

  const totalSalesValue = salesOrders.reduce((total, order) => {
    return total + Number(order.total_amount || 0);
  }, 0);

  const averageOrderValue =
    totalOrders > 0 ? totalSalesValue / totalOrders : 0;

  const uniqueCustomerCount = new Set(
    salesOrders.map((order) => order.customer_name).filter(Boolean)
  ).size;

  const latestOrder = [...salesOrders].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  const statusOptions = [
    ...new Set(salesOrders.map((order) => order.status).filter(Boolean)),
  ].sort();

  const displayedSalesOrders = salesOrders
    .filter((order) => {
      const searchableText = `${order.id} ${order.customer_name} ${
        order.created_by_name || ""
      } ${order.status}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
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

  const hasActiveSalesOrderFilters = searchQuery || statusFilter !== "all";

  function resetSalesOrderFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOption("newest");
  }

  const isDetailModalOpen =
    detailLoading || Boolean(detailError) || Boolean(selectedSalesOrder);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Sales Orders</h1>
          <p>
            Create customer orders, manage line items, and review sales order
            details.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={handleExportSalesOrders}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button type="button" onClick={handleOpenCreateSalesOrder}>
            + New Sales Order
          </button>
        </div>
      </div>

      {exportError && <p className="message error-message">{exportError}</p>}
      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      <div className="dashboard-metric-grid">
        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiShoppingCart />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{totalOrders}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Total Sales Value</span>
            <strong>{formatCurrency(totalSalesValue)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-purple">
          <div className="metric-icon">
            <FiFileText />
          </div>

          <div>
            <span>Average Order</span>
            <strong>{formatCurrency(averageOrderValue)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiUsers />
          </div>

          <div>
            <span>Customers Ordered</span>
            <strong>{uniqueCustomerCount}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest Order</span>
            <strong>{latestOrder ? formatShortDate(latestOrder.created_at) : "-"}</strong>
          </div>
        </article>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>All Sales Orders</h2>
            <p>
              {loading
                ? "Loading sales orders..."
                : `Showing ${displayedSalesOrders.length} of ${salesOrders.length} sales orders.`}
            </p>
          </div>
        </div>

        <div className="table-toolbar sales-table-toolbar">
          <input
            type="text"
            placeholder="Search by order, customer, creator, or status..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search sales orders"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter sales orders by status"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort sales orders"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total-desc">Total High-Low</option>
            <option value="total-asc">Total Low-High</option>
            <option value="customer-asc">Customer A-Z</option>
          </select>

          {hasActiveSalesOrderFilters && (
            <button
              type="button"
              onClick={resetSalesOrderFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {loading ? (
            <p>Loading sales orders...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchSalesOrders}>
                Try Again
              </button>
            </div>
          ) : salesOrders.length === 0 ? (
            <div className="empty-state">
              <h3>No sales orders found</h3>
              <p>Create the first sales order using the button above.</p>
            </div>
          ) : displayedSalesOrders.length === 0 ? (
            <div className="empty-state">
              <h3>No matching sales orders found</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetSalesOrderFilters}
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
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th>Subtotal</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Delivered By</th>
                    <th>Delivered At</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedSalesOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="code-pill">
                          SO-{String(order.id).padStart(4, "0")}
                        </span>
                      </td>

                      <td>
                        <strong>{order.customer_name}</strong>
                      </td>

                      <td>{order.created_by_name || "-"}</td>

                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {formatStatus(order.status)}
                        </span>
                      </td>

                      <td>{formatCurrency(order.subtotal)}</td>
                      <td>{formatCurrency(order.gst_amount)}</td>

                      <td>
                        <strong>{formatCurrency(order.total_amount)}</strong>
                      </td>

                      <td>{order.delivered_by_name || "-"}</td>
                      <td>{formatDate(order.delivered_at)}</td>
                      <td>{formatDate(order.created_at)}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => fetchSalesOrderDetails(order.id)}
                            className="secondary-button"
                          >
                            <FiEye />
                            View
                          </button>

                          {canDeliverOrder(order) && (
                            <button
                              type="button"
                              className="success-button"
                              onClick={() => handleOpenDeliveryConfirm(order)}
                              disabled={deliveringOrderId === order.id}
                            >
                              <FiTruck />
                              {deliveringOrderId === order.id ? "Delivering..." : "Deliver"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isSalesOrderFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card sales-order-form-modal">
            <div className="modal-header">
              <div>
                <h2>Create Sales Order</h2>
                <p>Select a customer and add one or more line items.</p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseCreateSalesOrder}
                aria-label="Close sales order form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateSalesOrder} className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="customer_id">Customer</label>
                <select
                  id="customer_id"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="line-items-section full-width">
                <div className="line-items-header">
                  <div>
                    <h3>Line Items</h3>
                    <p>Add products and quantities for this order.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="secondary-button"
                  >
                    <FiPlus />
                    Add Item
                  </button>
                </div>

                <div className="line-items-list">
                  {formData.items.map((item, index) => (
                    <div key={index} className="line-item-card">
                      <div className="line-item-card-header">
                        <strong>Item {index + 1}</strong>

                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="icon-button danger-icon-button"
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>

                      <div className="line-item-grid">
                        <div className="form-field">
                          <label htmlFor={`product_id_${index}`}>Product</label>
                          <select
                            id={`product_id_${index}`}
                            value={item.product_id}
                            onChange={(event) =>
                              handleItemChange(
                                index,
                                "product_id",
                                event.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select product</option>
                            {products.map((product) => {
                              const stockQuantity = Number(
                                product.stock_quantity || 0
                              );

                              return (
                                <option
                                  key={product.id}
                                  value={product.id}
                                  disabled={stockQuantity <= 0}
                                >
                                  {product.name} — {product.sku} — Stock:{" "}
                                  {product.stock_quantity}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="form-field">
                          <label htmlFor={`quantity_${index}`}>Quantity</label>
                          <input
                            id={`quantity_${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) =>
                              handleItemChange(
                                index,
                                "quantity",
                                event.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {createError && (
                <p className="message error-message full-width">
                  {createError}
                </p>
              )}

              <div className="form-actions">
                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Sales Order"}
                </button>

                <button
                  type="button"
                  onClick={handleCloseCreateSalesOrder}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deliveryConfirmOrder && (
        <div className="modal-backdrop">
          <section className="modal-card delivery-confirm-modal">
            <div className="modal-header">
              <div>
                <h2>Confirm Delivery</h2>
                <p>
                  This action will mark the customer order as delivered and deduct
                  stock from inventory.
                </p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseDeliveryConfirm}
                disabled={Boolean(deliveringOrderId)}
                aria-label="Close delivery confirmation"
              >
                <FiX />
              </button>
            </div>

            <div className="delivery-confirm-content">
              <div className="delivery-confirm-icon">
                <FiTruck />
              </div>

              <div>
                <strong>
                  SO-{String(deliveryConfirmOrder.id).padStart(4, "0")} ·{" "}
                  {deliveryConfirmOrder.customer_name}
                </strong>

                <p>
                  Stock will be deducted now and a sale inventory movement will be
                  created. This order cannot be delivered again after confirmation.
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleDeliverSalesOrder}
                disabled={Boolean(deliveringOrderId)}
              >
                {deliveringOrderId
                  ? "Marking as Delivered..."
                  : "Mark as Delivered"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseDeliveryConfirm}
                disabled={Boolean(deliveringOrderId)}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      {isDetailModalOpen && (
        <div className="modal-backdrop">
          <section className="modal-card sales-order-detail-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {selectedSalesOrder
                    ? `Sales Order SO-${String(selectedSalesOrder.id).padStart(
                        4,
                        "0"
                      )}`
                    : "Sales Order Details"}
                </h2>
                <p>Review customer, totals, and line items.</p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseDetails}
                aria-label="Close sales order details"
              >
                <FiX />
              </button>
            </div>

            {detailLoading ? (
              <p>Loading sales order details...</p>
            ) : detailError ? (
              <p className="message error-message">{detailError}</p>
            ) : (
              selectedSalesOrder && (
                <>
                  <div className="detail-summary-grid">
                    <article className="detail-summary-card">
                      <span>Customer</span>
                      <strong>{selectedSalesOrder.customer_name}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Created By</span>
                      <strong>{selectedSalesOrder.created_by_name || "-"}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Status</span>
                      <strong>
                        <span
                          className={getStatusBadgeClass(
                            selectedSalesOrder.status
                          )}
                        >
                          {formatStatus(selectedSalesOrder.status)}
                        </span>
                      </strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Created At</span>
                      <strong>{formatDate(selectedSalesOrder.created_at)}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Delivered By</span>
                      <strong>{selectedSalesOrder.delivered_by_name || "-"}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Delivered At</span>
                      <strong>{formatDate(selectedSalesOrder.delivered_at)}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>Subtotal</span>
                      <strong>{formatCurrency(selectedSalesOrder.subtotal)}</strong>
                    </article>

                    <article className="detail-summary-card">
                      <span>GST</span>
                      <strong>{formatCurrency(selectedSalesOrder.gst_amount)}</strong>
                    </article>

                    <article className="detail-summary-card detail-total-card">
                      <span>Total</span>
                      <strong>
                        {formatCurrency(selectedSalesOrder.total_amount)}
                      </strong>
                    </article>
                  </div>

                  <h3>Line Items</h3>

                  {selectedSalesOrder.items.length === 0 ? (
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
                          {selectedSalesOrder.items.map((item) => (
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

export default SalesOrdersPage;