import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFilter,
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
import "../styles/purchaseOrders.css";

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
      return "po-status-pill status-received";
    }

    if (status === "supplier_delivered") {
      return "po-status-pill status-supplier-delivered";
    }

    if (status === "ordered") {
      return "po-status-pill status-ordered";
    }

    if (status === "cancelled") {
      return "po-status-pill status-cancelled";
    }

    return "po-status-pill status-draft";
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
      "supplier_delivered",
      "received",
    ]),
  ].sort();

  const totalPurchaseOrders = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((order) => order.status === "draft").length;
  const orderedCount = purchaseOrders.filter((order) => order.status === "ordered").length;
  const supplierDeliveredCount = purchaseOrders.filter(
    (order) => order.status === "supplier_delivered"
  ).length;
  const receivedCount = purchaseOrders.filter((order) => order.status === "received").length;
  const pendingReceiptCount = purchaseOrders.filter((order) =>
    canReceivePurchaseOrder(order)
  ).length;
  const procurementValue = purchaseOrders.reduce((total, order) => {
    return total + Number(order.total_amount || 0);
  }, 0);

  const latestPurchaseOrder = [...purchaseOrders].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

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

  const isDetailModalOpen =
    Boolean(selectedPurchaseOrder) || detailLoading || Boolean(detailError);

  return (
    <section className="po-page">
      <header className="po-command-bar">
        <div>
          <span className="po-eyebrow">Procurement</span>
          <h1>Purchase orders</h1>
          <p>
            Create supplier purchase orders, track supplier delivery, and receive
            stock into inventory when orders arrive.
          </p>
        </div>

        <div className="po-command-actions">
          <button
            type="button"
            className="po-secondary-command"
            onClick={fetchPageData}
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={handleExportPurchaseOrders}
            className="po-secondary-command"
          >
            <FiDownload />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleOpenForm}
            className="po-primary-command"
          >
            <FiPlus />
            New purchase order
          </button>
        </div>
      </header>

      {(error || successMessage) && (
        <div className="po-message-stack">
          {error && <p className="message error-message">{error}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="po-kpi-strip" aria-label="Purchase order metrics">
        <article className="po-kpi-card">
          <div className="po-kpi-icon">
            <FiShoppingBag />
          </div>

          <div>
            <span>Total POs</span>
            <strong>{totalPurchaseOrders}</strong>
            <p>Purchase order records</p>
          </div>
        </article>

        <article className="po-kpi-card">
          <div className="po-kpi-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Procurement value</span>
            <strong>{formatCurrency(procurementValue)}</strong>
            <p>Total PO value</p>
          </div>
        </article>

        <article className="po-kpi-card">
          <div className="po-kpi-icon">
            <FiPackage />
          </div>

          <div>
            <span>Draft</span>
            <strong>{draftCount}</strong>
            <p>Not yet ordered</p>
          </div>
        </article>

        <article className="po-kpi-card warning">
          <div className="po-kpi-icon">
            <FiTruck />
          </div>

          <div>
            <span>Ordered</span>
            <strong>{orderedCount}</strong>
            <p>Sent to supplier</p>
          </div>
        </article>

        <article className="po-kpi-card info">
          <div className="po-kpi-icon">
            <FiClock />
          </div>

          <div>
            <span>Supplier delivered</span>
            <strong>{supplierDeliveredCount}</strong>
            <p>Awaiting staff receipt</p>
          </div>
        </article>

        <article className="po-kpi-card success">
          <div className="po-kpi-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Received</span>
            <strong>{receivedCount}</strong>
            <p>Stock updated</p>
          </div>
        </article>
      </section>

      <section className="po-workspace">
        <div className="po-workspace-header">
          <div>
            <span>Purchase order workspace</span>
            <h2>Purchase order list</h2>
            <p>
              {loading
                ? "Loading purchase orders..."
                : `Showing ${displayedPurchaseOrders.length} of ${purchaseOrders.length} purchase orders.`}
              {latestPurchaseOrder
                ? ` Latest PO: ${formatDate(latestPurchaseOrder.created_at)}.`
                : ""}
            </p>
          </div>

          <div className="po-workspace-summary">
            <span>{pendingReceiptCount}</span>
            <p>ready to receive</p>
          </div>
        </div>

        <div className="po-toolbar">
          <div className="po-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by supplier, status, creator, or ID"
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
            <option value="all">All statuses</option>
            {filterStatusOptions.map((status) => (
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total-desc">Total high-low</option>
            <option value="total-asc">Total low-high</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="po-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="po-table-area">
          {loading ? (
            <div className="po-empty-state">
              <FiShoppingBag />
              <h3>Loading purchase orders</h3>
              <p>Please wait while procurement data is loaded.</p>
            </div>
          ) : error ? (
            <div className="po-empty-state">
              <FiAlertTriangle />
              <h3>Could not load purchase orders</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchPageData}
                className="po-primary-command"
              >
                Try again
              </button>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="po-empty-state">
              <FiShoppingBag />
              <h3>No purchase orders found</h3>
              <p>Create your first supplier purchase order using the command bar.</p>

              <button
                type="button"
                onClick={handleOpenForm}
                className="po-primary-command"
              >
                <FiPlus />
                New purchase order
              </button>
            </div>
          ) : displayedPurchaseOrders.length === 0 ? (
            <div className="po-empty-state">
              <FiSearch />
              <h3>No matching purchase orders</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetFilters}
                className="po-secondary-command"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="po-table-wrapper">
              <table className="po-table">
                <thead>
                  <tr>
                    <th>PO</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Expected delivery</th>
                    <th>Created by</th>
                    <th>Created at</th>
                    <th>Update status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedPurchaseOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={order.status === "received" ? "po-received-row" : ""}
                    >
                      <td>
                        <span className="po-code-pill">
                          PO-{String(order.id).padStart(4, "0")}
                        </span>
                      </td>

                      <td>
                        <div className="po-supplier-cell">
                          <span>
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
                        <span className="po-item-count-pill">
                          <FiPackage />
                          {order.item_count}
                        </span>
                      </td>

                      <td>
                        <strong>{formatCurrency(order.total_amount)}</strong>
                      </td>

                      <td>{formatDate(order.expected_delivery_date)}</td>
                      <td>{order.created_by_name || "-"}</td>
                      <td>{formatDateTime(order.created_at)}</td>

                      <td>
                        <select
                          className="po-status-select"
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
                            <option value="supplier_delivered">
                              Supplier delivered
                            </option>
                          )}
                        </select>
                      </td>

                      <td>
                        <div className="po-table-actions">
                          <button
                            type="button"
                            onClick={() => handleViewPurchaseOrder(order.id)}
                            className="po-icon-action"
                          >
                            <FiEye />
                            <span>View</span>
                          </button>

                          {canReceivePurchaseOrder(order) && (
                            <button
                              type="button"
                              onClick={() => handleReceivePurchaseOrder(order.id)}
                              className="po-icon-action success"
                              disabled={receivingOrderId === order.id}
                            >
                              <FiCheckCircle />
                              <span>
                                {receivingOrderId === order.id
                                  ? "Receiving"
                                  : "Receive"}
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

      {isFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card purchase-order-form-modal">
            <div className="po-modal-header">
              <div>
                <span>Purchase order</span>
                <h2>Create purchase order</h2>
                <p>
                  Select a supplier, add products, and record expected purchase
                  cost. Stock increases only after receiving.
                </p>
              </div>

              <button
                type="button"
                className="po-icon-button"
                onClick={handleCloseForm}
                aria-label="Close purchase order form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchaseOrder} className="po-form-grid">
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
                  Expected delivery date
                </label>
                <input
                  id="expected_delivery_date"
                  name="expected_delivery_date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-field po-form-full">
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

              <div className="po-items-section po-form-full">
                <div className="po-section-heading-row">
                  <div>
                    <h3>Order items</h3>
                    <p>Add one or more products for this purchase order.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="po-secondary-command"
                  >
                    <FiPlus />
                    Add item
                  </button>
                </div>

                {formData.items.map((item, index) => {
                  const lineTotal =
                    (Number(item.quantity) || 0) *
                    (Number(item.unit_cost) || 0);

                  return (
                    <div className="po-item-row" key={index}>
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
                        <label htmlFor={`unit-cost-${index}`}>Unit cost</label>
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

                      <div className="po-line-total-preview">
                        <span>Line total</span>
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </div>

                      <button
                        type="button"
                        className="po-icon-button"
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

              <div className="po-total-preview po-form-full">
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
                <p className="message error-message po-form-full">{formError}</p>
              )}

              <p className="po-auth-note po-form-full">
                Creating a purchase order does not increase stock. Stock is
                updated only after the order is received by staff.
              </p>

              <div className="po-form-actions po-form-full">
                <button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create purchase order"}
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

      {isDetailModalOpen && (
        <div className="modal-backdrop">
          <section className="modal-card purchase-order-detail-modal">
            <div className="po-modal-header">
              <div>
                <span>Purchase order details</span>
                <h2>
                  {selectedPurchaseOrder
                    ? `PO-${String(selectedPurchaseOrder.id).padStart(4, "0")}`
                    : "Purchase order details"}
                </h2>
                <p>Review supplier, totals, status, delivery, and ordered items.</p>
              </div>

              <button
                type="button"
                className="po-icon-button"
                onClick={handleCloseDetails}
                aria-label="Close purchase order details"
              >
                <FiX />
              </button>
            </div>

            {detailLoading ? (
              <div className="po-empty-state compact">
                <FiShoppingBag />
                <h3>Loading purchase order details</h3>
                <p>Please wait while the purchase order detail is loaded.</p>
              </div>
            ) : detailError ? (
              <p className="message error-message">{detailError}</p>
            ) : (
              selectedPurchaseOrder && (
                <>
                  <div className="po-detail-summary-grid">
                    <article>
                      <span>Supplier</span>
                      <strong>{selectedPurchaseOrder.supplier_name}</strong>
                      <p>{selectedPurchaseOrder.supplier_contact_person || "-"}</p>
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
                      <span>Expected delivery</span>
                      <strong>
                        {formatDate(selectedPurchaseOrder.expected_delivery_date)}
                      </strong>
                    </article>

                    <article className="total">
                      <span>Total</span>
                      <strong>
                        {formatCurrency(selectedPurchaseOrder.total_amount)}
                      </strong>
                    </article>

                    <article>
                      <span>Supplier delivered</span>
                      <strong>
                        {selectedPurchaseOrder.supplier_delivered_at
                          ? formatDateTime(selectedPurchaseOrder.supplier_delivered_at)
                          : "-"}
                      </strong>
                      <p>{selectedPurchaseOrder.supplier_delivered_by_name || ""}</p>
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
                    <p className="po-auth-note">{selectedPurchaseOrder.notes}</p>
                  )}

                  {selectedPurchaseOrder.supplier_delivery_note && (
                    <p className="po-auth-note">
                      Supplier note: {selectedPurchaseOrder.supplier_delivery_note}
                    </p>
                  )}

                  <div className="po-detail-section-header">
                    <h3>Ordered items</h3>
                    <p>Products, quantities, unit costs, and line totals.</p>
                  </div>

                  <div className="po-table-wrapper">
                    <table className="po-table detail-lines">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Quantity</th>
                          <th>Unit cost</th>
                          <th>Line total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedPurchaseOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.product_name}</strong>
                            </td>
                            <td>
                              <span className="po-code-pill">
                                {item.product_sku}
                              </span>
                            </td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unit_cost)}</td>
                            <td>
                              <strong>{formatCurrency(item.line_total)}</strong>
                            </td>
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
    </section>
  );
}

export default PurchaseOrdersPage;
