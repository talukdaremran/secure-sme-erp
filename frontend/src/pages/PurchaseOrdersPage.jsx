import { useEffect, useState } from "react";
import {
  FiDownload,
  FiEye,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";

const GST_RATE = 0.1;

const initialFormData = {
  supplier_id: "",
  status: "draft",
  expected_delivery_date: "",
  notes: "",
  items: [
    {
      product_id: "",
      quantity: 1,
      unit_cost: "",
    },
  ],
};

const staffStatusOptions = ["draft", "ordered", "cancelled"];

function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [receivingOrderId, setReceivingOrderId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchPageData() {
    try {
      setLoading(true);
      setError("");

      const [purchaseOrdersResponse, suppliersResponse, productsResponse] =
        await Promise.all([
          apiClient.get("/purchase-orders"),
          apiClient.get("/suppliers"),
          apiClient.get("/products"),
        ]);

      setPurchaseOrders(
        purchaseOrdersResponse.data?.data?.purchaseOrders || []
      );
      setSuppliers(suppliersResponse.data?.data?.suppliers || []);
      setProducts(productsResponse.data?.data?.products || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load purchase orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPageData();
  }, []);

  function handleOpenForm() {
    setFormData(initialFormData);
    setFormError("");
    setSuccessMessage("");
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setFormData(initialFormData);
    setFormError("");
    setIsFormOpen(false);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleItemChange(index, field, value) {
    setFormData((previousData) => {
      const updatedItems = previousData.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
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
          quantity: 1,
          unit_cost: "",
        },
      ],
    }));
  }

  function handleRemoveItem(index) {
    setFormData((previousData) => {
      if (previousData.items.length === 1) {
        return previousData;
      }

      return {
        ...previousData,
        items: previousData.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  async function handleExportPurchaseOrders() {
    try {
      setError("");

      const response = await apiClient.get("/exports/purchase-orders", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "purchase-orders.csv");

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to export purchase orders."
      );
    }
  }

  function calculatePreviewSubtotal() {
    return formData.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;

      return sum + quantity * unitCost;
    }, 0);
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

    return new Date(value).toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatLabel(value) {
    if (!value) {
      return "-";
    }

    return String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function getStatusBadgeClass(status) {
    if (status === "received") {
      return "badge badge-success";
    }

    if (status === "supplier_delivered") {
      return "badge badge-info";
    }

    if (status === "ordered") {
      return "badge badge-warning";
    }

    if (status === "cancelled") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  function canReceivePurchaseOrder(order) {
    return (
      order.status === "draft" ||
      order.status === "ordered" ||
      order.status === "supplier_delivered"
    );
  }

  async function handleSubmitPurchaseOrder(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (!formData.supplier_id) {
      setFormError("Supplier is required.");
      return;
    }

    const hasInvalidItem = formData.items.some((item) => {
      return (
        !item.product_id ||
        Number(item.quantity) <= 0 ||
        Number(item.unit_cost) < 0 ||
        item.unit_cost === ""
      );
    });

    if (hasInvalidItem) {
      setFormError("Each item needs a product, quantity, and unit cost.");
      return;
    }

    try {
      setSaving(true);

      await apiClient.post("/purchase-orders", {
        supplier_id: Number(formData.supplier_id),
        status: formData.status,
        expected_delivery_date: formData.expected_delivery_date || null,
        notes: formData.notes || null,
        items: formData.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
        })),
      });

      setSuccessMessage("Purchase order created successfully.");
      handleCloseForm();
      await fetchPageData();
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Failed to create purchase order."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(orderId, status) {
    try {
      setUpdatingStatusId(orderId);
      setSuccessMessage("");
      setError("");

      await apiClient.patch(`/purchase-orders/${orderId}/status`, {
        status,
      });

      setSuccessMessage("Purchase order status updated successfully.");
      await fetchPageData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update purchase order status."
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleReceivePurchaseOrder(orderId) {
    try {
      setReceivingOrderId(orderId);
      setSuccessMessage("");
      setError("");

      await apiClient.patch(`/purchase-orders/${orderId}/receive`);

      setSuccessMessage(
        "Purchase order received successfully. Product stock has been updated."
      );

      await fetchPageData();

      if (selectedPurchaseOrder?.id === orderId) {
        const response = await apiClient.get(`/purchase-orders/${orderId}`);
        setSelectedPurchaseOrder(response.data?.data?.purchaseOrder || null);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to receive purchase order."
      );
    } finally {
      setReceivingOrderId(null);
    }
  }

  async function handleViewPurchaseOrder(orderId) {
    try {
      setDetailLoading(true);
      setDetailError("");
      setSelectedPurchaseOrder(null);

      const response = await apiClient.get(`/purchase-orders/${orderId}`);

      setSelectedPurchaseOrder(response.data?.data?.purchaseOrder || null);
    } catch (error) {
      setDetailError(
        error.response?.data?.message || "Failed to load purchase order details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseDetails() {
    setSelectedPurchaseOrder(null);
    setDetailError("");
  }

  const previewSubtotal = calculatePreviewSubtotal();
  const previewGst = previewSubtotal * GST_RATE;
  const previewTotal = previewSubtotal + previewGst;

  const filterStatusOptions = [
    ...new Set([
      ...purchaseOrders.map((order) => order.status).filter(Boolean),
      ...staffStatusOptions,
    ]),
  ].sort();

  const displayedPurchaseOrders = purchaseOrders
    .filter((order) => {
      const searchableText = `${order.id || ""} ${order.supplier_name || ""} ${
        order.status || ""
      } ${order.created_by_name || ""}`.toLowerCase();

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
        return Number(b.total_amount) - Number(a.total_amount);
      }

      if (sortOption === "total-asc") {
        return Number(a.total_amount) - Number(b.total_amount);
      }

      return 0;
    });

  const hasActiveFilters = searchQuery || statusFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOption("newest");
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p>
            Create and track supplier purchase orders before receiving stock
            into inventory.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={handleExportPurchaseOrders}
            className="secondary-button"
          >
            <FiDownload />
            Export CSV
          </button>

          <button type="button" onClick={handleOpenForm}>
            <FiPlus />
            New Purchase Order
          </button>
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      {isFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card purchase-order-form-modal">
            <div className="modal-header">
              <div>
                <h2>Create Purchase Order</h2>
                <p>
                  Select a supplier, add products, and record expected purchase
                  cost.
                </p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseForm}
                aria-label="Close purchase order form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchaseOrder} className="form-grid">
              <div className="form-field">
                <label htmlFor="supplier_id">Supplier</label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  {staffStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="expected_delivery_date">
                  Expected Delivery Date
                </label>
                <input
                  id="expected_delivery_date"
                  name="expected_delivery_date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Optional purchase order notes"
                />
              </div>

              <div className="form-full-width purchase-order-items-section">
                <div className="section-heading-row">
                  <div>
                    <h3>Order Items</h3>
                    <p>Add one or more products for this purchase order.</p>
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

                {formData.items.map((item, index) => {
                  const lineTotal =
                    (Number(item.quantity) || 0) *
                    (Number(item.unit_cost) || 0);

                  return (
                    <div className="purchase-order-item-row" key={index}>
                      <div className="form-field">
                        <label htmlFor={`product-${index}`}>Product</label>
                        <select
                          id={`product-${index}`}
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
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field">
                        <label htmlFor={`quantity-${index}`}>Quantity</label>
                        <input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
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

                      <div className="form-field">
                        <label htmlFor={`unit-cost-${index}`}>Unit Cost</label>
                        <input
                          id={`unit-cost-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(event) =>
                            handleItemChange(
                              index,
                              "unit_cost",
                              event.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="line-total-preview">
                        <span>Line Total</span>
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </div>

                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                        aria-label="Remove purchase order item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="form-full-width purchase-order-total-preview">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(previewSubtotal)}</strong>
                </div>

                <div>
                  <span>GST</span>
                  <strong>{formatCurrency(previewGst)}</strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>{formatCurrency(previewTotal)}</strong>
                </div>
              </div>

              {formError && (
                <p className="message error-message form-full-width">
                  {formError}
                </p>
              )}

              <p className="auth-note form-full-width">
                Creating a purchase order does not increase stock yet. Stock
                will increase only when receiving is added in the next issue.
              </p>

              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Purchase Order"}
                </button>

                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {(selectedPurchaseOrder || detailLoading || detailError) && (
        <div className="modal-backdrop">
          <section className="modal-card purchase-order-detail-modal">
            <div className="modal-header">
              <div>
                <h2>Purchase Order Details</h2>
                <p>Review supplier, totals, status, and ordered items.</p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseDetails}
                aria-label="Close purchase order details"
              >
                <FiX />
              </button>
            </div>

            {detailLoading ? (
              <p>Loading purchase order details...</p>
            ) : detailError ? (
              <p className="message error-message">{detailError}</p>
            ) : (
              selectedPurchaseOrder && (
                <>
                  <div className="detail-summary-grid">
                    <article>
                      <span>Supplier</span>
                      <strong>{selectedPurchaseOrder.supplier_name}</strong>
                      <p>
                        {selectedPurchaseOrder.supplier_contact_person || "-"}
                      </p>
                    </article>

                    <article>
                      <span>Status</span>
                      <strong>
                        <span
                          className={getStatusBadgeClass(
                            selectedPurchaseOrder.status
                          )}
                        >
                          {formatLabel(selectedPurchaseOrder.status)}
                        </span>
                      </strong>
                    </article>

                    <article>
                      <span>Expected Delivery</span>
                      <strong>
                        {formatDate(
                          selectedPurchaseOrder.expected_delivery_date
                        )}
                      </strong>
                    </article>

                    <article>
                      <span>Total</span>
                      <strong>
                        {formatCurrency(selectedPurchaseOrder.total_amount)}
                      </strong>
                    </article>

                    <article>
                      <span>Received</span>
                      <strong>
                        {selectedPurchaseOrder.received_at
                          ? formatDateTime(selectedPurchaseOrder.received_at)
                          : "-"}
                      </strong>
                      <p>{selectedPurchaseOrder.received_by_name || ""}</p>
                    </article>
                  </div>

                  {selectedPurchaseOrder.notes && (
                    <p className="auth-note">{selectedPurchaseOrder.notes}</p>
                  )}

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Quantity</th>
                          <th>Unit Cost</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedPurchaseOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{item.product_sku}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unit_cost)}</td>
                            <td>{formatCurrency(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}
          </section>
        </div>
      )}

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Purchase Order List</h2>
            <p>
              {loading
                ? "Loading purchase orders..."
                : `Showing ${displayedPurchaseOrders.length} of ${purchaseOrders.length} purchase orders.`}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPageData}
            className="secondary-button"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="table-toolbar customers-table-toolbar">
          <div className="toolbar-input-with-icon">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by supplier, status, creator, or ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search purchase orders"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter purchase orders by status"
          >
            <option value="all">All Statuses</option>
            {staffStatusOptions.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort purchase orders"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total-desc">Total High-Low</option>
            <option value="total-asc">Total Low-High</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {loading ? (
            <p>Loading purchase orders...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchPageData}>
                Try Again
              </button>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="empty-state">
              <FiShoppingBag />
              <h3>No purchase orders found</h3>
              <p>Create your first purchase order using the button above.</p>
            </div>
          ) : displayedPurchaseOrders.length === 0 ? (
            <div className="empty-state">
              <FiSearch />
              <h3>No matching purchase orders found</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetFilters}
                className="secondary-button"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>PO</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Expected Delivery</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Update Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedPurchaseOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={order.status === "received" ? "purchase-order-received-row" : ""}
                    >
                      <td>
                        <strong>PO-{String(order.id).padStart(4, "0")}</strong>
                      </td>

                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar">
                            <FiTruck />
                          </span>

                          <strong>{order.supplier_name}</strong>
                        </div>
                      </td>

                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {formatLabel(order.status)}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-info">
                          <FiPackage />
                          {order.item_count}
                        </span>
                      </td>

                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>{formatDate(order.expected_delivery_date)}</td>
                      <td>{order.created_by_name || "-"}</td>
                      <td>{formatDateTime(order.created_at)}</td>

                      <td>
                        <select
                          value={order.status === "received" ? "received" : order.status}
                          onChange={(event) =>
                            handleUpdateStatus(order.id, event.target.value)
                          }
                          disabled={
                            updatingStatusId === order.id ||
                            receivingOrderId === order.id ||
                            order.status === "received" ||
                            order.status === "supplier_delivered"
                          }
                        >
                          {staffStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {formatLabel(status)}
                            </option>
                          ))}

                          {order.status === "received" && (
                            <option value="received">Received</option>
                          )}

                          {order.status === "supplier_delivered" && (
                            <option value="supplier_delivered">Supplier Delivered</option>
                          )}
                        </select>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => handleViewPurchaseOrder(order.id)}
                            className="secondary-button"
                          >
                            <FiEye />
                            View
                          </button>

                          {canReceivePurchaseOrder(order) && (
                          <button
                            type="button"
                            onClick={() => handleReceivePurchaseOrder(order.id)}
                            className="success-button"
                            disabled={receivingOrderId === order.id}
                          >
                            {receivingOrderId === order.id ? "Receiving..." : "Receive"}
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
    </section>
  );
}

export default PurchaseOrdersPage;