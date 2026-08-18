import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
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

  async function refreshSalesOrdersPage() {
    await Promise.all([fetchSalesOrders(), fetchFormOptions()]);
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
    refreshSalesOrdersPage();
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

      await refreshSalesOrdersPage();
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

      await refreshSalesOrdersPage();

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
      return "sales-status-pill status-success";
    }

    if (
      normalizedStatus === "pending" ||
      normalizedStatus === "placed" ||
      normalizedStatus === "draft"
    ) {
      return "sales-status-pill status-warning";
    }

    if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "failed" ||
      normalizedStatus === "rejected"
    ) {
      return "sales-status-pill status-danger";
    }

    return "sales-status-pill status-info";
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

  const awaitingDeliveryOrders = salesOrders.filter((order) => {
    return String(order.status || "").toLowerCase() === "placed";
  });

  const deliveredOrders = salesOrders.filter((order) => {
    return String(order.status || "").toLowerCase() === "delivered";
  });

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
    <section className="sales-page">
      <header className="sales-command-bar">
        <div>
          <span className="sales-eyebrow">Sales fulfilment</span>
          <h1>Sales orders</h1>
          <p>
            Create customer orders, review line items, track fulfilment status,
            and mark placed orders as delivered to update stock.
          </p>
        </div>

        <div className="sales-command-actions">
          <button
            type="button"
            className="sales-secondary-command"
            onClick={refreshSalesOrdersPage}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>

          <button
            type="button"
            className="sales-secondary-command"
            onClick={handleExportSalesOrders}
            disabled={exporting}
          >
            <FiDownload />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            type="button"
            className="sales-primary-command"
            onClick={handleOpenCreateSalesOrder}
          >
            <FiPlus />
            New sales order
          </button>
        </div>
      </header>

      {(exportError || successMessage || error) && (
        <div className="sales-message-stack">
          {exportError && <p className="message error-message">{exportError}</p>}
          {error && <p className="message error-message">{error}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="sales-kpi-strip" aria-label="Sales order metrics">
        <article className="sales-kpi-card">
          <div className="sales-kpi-icon">
            <FiShoppingCart />
          </div>

          <div>
            <span>Total orders</span>
            <strong>{totalOrders}</strong>
            <p>Order records</p>
          </div>
        </article>

        <article className="sales-kpi-card">
          <div className="sales-kpi-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Sales value</span>
            <strong>{formatCurrency(totalSalesValue)}</strong>
            <p>Order totals</p>
          </div>
        </article>

        <article className="sales-kpi-card">
          <div className="sales-kpi-icon">
            <FiFileText />
          </div>

          <div>
            <span>Average order</span>
            <strong>{formatCurrency(averageOrderValue)}</strong>
            <p>Average order value</p>
          </div>
        </article>

        <article className="sales-kpi-card warning">
          <div className="sales-kpi-icon">
            <FiTruck />
          </div>

          <div>
            <span>Awaiting delivery</span>
            <strong>{awaitingDeliveryOrders.length}</strong>
            <p>Placed orders</p>
          </div>
        </article>

        <article className="sales-kpi-card success">
          <div className="sales-kpi-icon">
            <FiClock />
          </div>

          <div>
            <span>Delivered</span>
            <strong>{deliveredOrders.length}</strong>
            <p>Fulfilled orders</p>
          </div>
        </article>

        <article className="sales-kpi-card">
          <div className="sales-kpi-icon">
            <FiUsers />
          </div>

          <div>
            <span>Customers</span>
            <strong>{uniqueCustomerCount}</strong>
            <p>Ordered customers</p>
          </div>
        </article>
      </section>

      <section className="sales-workspace">
        <div className="sales-workspace-header">
          <div>
            <span>Order workspace</span>
            <h2>All sales orders</h2>
            <p>
              {loading
                ? "Loading sales orders..."
                : `Showing ${displayedSalesOrders.length} of ${salesOrders.length} sales orders.`}
              {latestOrder ? ` Latest order: ${formatShortDate(latestOrder.created_at)}.` : ""}
            </p>
          </div>
        </div>

        <div className="sales-toolbar">
          <div className="sales-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by order, customer, creator, or status"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search sales orders"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter sales orders by status"
          >
            <option value="all">All statuses</option>
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total-desc">Total high-low</option>
            <option value="total-asc">Total low-high</option>
            <option value="customer-asc">Customer A-Z</option>
          </select>

          {hasActiveSalesOrderFilters && (
            <button
              type="button"
              onClick={resetSalesOrderFilters}
              className="sales-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="sales-table-area">
          {loading ? (
            <div className="sales-empty-state">
              <FiShoppingCart />
              <h3>Loading sales orders</h3>
              <p>Please wait while order data is loaded.</p>
            </div>
          ) : error ? (
            <div className="sales-empty-state">
              <FiAlertTriangle />
              <h3>Could not load sales orders</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchSalesOrders}
                className="sales-primary-command"
              >
                Try again
              </button>
            </div>
          ) : salesOrders.length === 0 ? (
            <div className="sales-empty-state">
              <FiShoppingCart />
              <h3>No sales orders found</h3>
              <p>Create the first sales order using the command bar above.</p>

              <button
                type="button"
                onClick={handleOpenCreateSalesOrder}
                className="sales-primary-command"
              >
                <FiPlus />
                New sales order
              </button>
            </div>
          ) : displayedSalesOrders.length === 0 ? (
            <div className="sales-empty-state">
              <FiFilter />
              <h3>No matching sales orders</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetSalesOrderFilters}
                className="sales-secondary-command"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="sales-table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Created by</th>
                    <th>Status</th>
                    <th>Subtotal</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Delivered by</th>
                    <th>Delivered at</th>
                    <th>Created at</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedSalesOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="sales-code-pill">
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
                        <div className="sales-table-actions">
                          <button
                            type="button"
                            onClick={() => fetchSalesOrderDetails(order.id)}
                            className="sales-icon-action"
                          >
                            <FiEye />
                            <span>View</span>
                          </button>

                          {canDeliverOrder(order) && (
                            <button
                              type="button"
                              className="sales-icon-action success"
                              onClick={() => handleOpenDeliveryConfirm(order)}
                              disabled={deliveringOrderId === order.id}
                            >
                              <FiTruck />
                              <span>
                                {deliveringOrderId === order.id
                                  ? "Delivering"
                                  : "Deliver"}
                              </span>
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
      </section>

      {isSalesOrderFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card sales-order-form-modal">
            <div className="sales-modal-header">
              <div>
                <span>Sales order</span>
                <h2>Create sales order</h2>
                <p>Select a customer and add one or more product line items.</p>
              </div>

              <button
                type="button"
                className="sales-icon-button"
                onClick={handleCloseCreateSalesOrder}
                aria-label="Close sales order form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateSalesOrder} className="sales-form-grid">
              <div className="form-field sales-form-full">
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

              <div className="sales-line-items-section sales-form-full">
                <div className="sales-line-items-header">
                  <div>
                    <h3>Line items</h3>
                    <p>Add products and quantities for this order.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="sales-secondary-command"
                  >
                    <FiPlus />
                    Add item
                  </button>
                </div>

                <div className="sales-line-items-list">
                  {formData.items.map((item, index) => (
                    <div key={index} className="sales-line-item-card">
                      <div className="sales-line-item-card-header">
                        <strong>Item {index + 1}</strong>

                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="sales-icon-button danger"
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>

                      <div className="sales-line-item-grid">
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
                <p className="message error-message sales-form-full">
                  {createError}
                </p>
              )}

              <div className="sales-form-actions sales-form-full">
                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create sales order"}
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
          <section className="modal-card sales-delivery-confirm-modal">
            <div className="sales-modal-header">
              <div>
                <span>Delivery confirmation</span>
                <h2>Confirm delivery</h2>
                <p>
                  This will mark the customer order as delivered and deduct stock
                  from inventory.
                </p>
              </div>

              <button
                type="button"
                className="sales-icon-button"
                onClick={handleCloseDeliveryConfirm}
                disabled={Boolean(deliveringOrderId)}
                aria-label="Close delivery confirmation"
              >
                <FiX />
              </button>
            </div>

            <div className="sales-delivery-confirm-content">
              <div className="sales-delivery-confirm-icon">
                <FiTruck />
              </div>

              <div>
                <strong>
                  SO-{String(deliveryConfirmOrder.id).padStart(4, "0")} ·{" "}
                  {deliveryConfirmOrder.customer_name}
                </strong>

                <p>
                  Stock will be deducted now and a sale inventory movement will
                  be created. This order cannot be delivered again after
                  confirmation.
                </p>
              </div>
            </div>

            <div className="sales-form-actions">
              <button
                type="button"
                onClick={handleDeliverSalesOrder}
                disabled={Boolean(deliveringOrderId)}
              >
                {deliveringOrderId
                  ? "Marking as delivered..."
                  : "Mark as delivered"}
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
            <div className="sales-modal-header">
              <div>
                <span>Sales order details</span>
                <h2>
                  {selectedSalesOrder
                    ? `SO-${String(selectedSalesOrder.id).padStart(4, "0")}`
                    : "Sales order details"}
                </h2>
                <p>Review customer, fulfilment status, totals, and line items.</p>
              </div>

              <button
                type="button"
                className="sales-icon-button"
                onClick={handleCloseDetails}
                aria-label="Close sales order details"
              >
                <FiX />
              </button>
            </div>

            {detailLoading ? (
              <div className="sales-empty-state compact">
                <FiFileText />
                <h3>Loading order details</h3>
                <p>Please wait while the order detail is loaded.</p>
              </div>
            ) : detailError ? (
              <p className="message error-message">{detailError}</p>
            ) : (
              selectedSalesOrder && (
                <>
                  <div className="sales-detail-summary-grid">
                    <article className="sales-detail-summary-card">
                      <span>Customer</span>
                      <strong>{selectedSalesOrder.customer_name}</strong>
                    </article>

                    <article className="sales-detail-summary-card">
                      <span>Created by</span>
                      <strong>{selectedSalesOrder.created_by_name || "-"}</strong>
                    </article>

                    <article className="sales-detail-summary-card">
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

                    <article className="sales-detail-summary-card">
                      <span>Created at</span>
                      <strong>{formatDate(selectedSalesOrder.created_at)}</strong>
                    </article>

                    <article className="sales-detail-summary-card">
                      <span>Delivered by</span>
                      <strong>{selectedSalesOrder.delivered_by_name || "-"}</strong>
                    </article>

                    <article className="sales-detail-summary-card">
                      <span>Delivered at</span>
                      <strong>{formatDate(selectedSalesOrder.delivered_at)}</strong>
                    </article>

                    <article className="sales-detail-summary-card">
                      <span>Subtotal</span>
                      <strong>{formatCurrency(selectedSalesOrder.subtotal)}</strong>
                    </article>

                    <article className="sales-detail-summary-card">
                      <span>GST</span>
                      <strong>{formatCurrency(selectedSalesOrder.gst_amount)}</strong>
                    </article>

                    <article className="sales-detail-summary-card total">
                      <span>Total</span>
                      <strong>
                        {formatCurrency(selectedSalesOrder.total_amount)}
                      </strong>
                    </article>
                  </div>

                  <div className="sales-detail-section-header">
                    <h3>Line items</h3>
                    <p>Products, quantities, unit prices, and line totals.</p>
                  </div>

                  {selectedSalesOrder.items.length === 0 ? (
                    <p>No line items found.</p>
                  ) : (
                    <div className="sales-table-wrapper">
                      <table className="sales-table detail-lines">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Quantity</th>
                            <th>Unit price</th>
                            <th>Line total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedSalesOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.product_name}</strong>
                              </td>

                              <td>
                                <span className="sales-code-pill">{item.sku}</span>
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
