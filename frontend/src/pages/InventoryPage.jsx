import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiArchive,
  FiBox,
  FiClock,
  FiExternalLink,
  FiFilter,
  FiMinusCircle,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSliders,
  FiX,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import "../styles/inventory.css";

const initialFormData = {
  product_id: "",
  quantity_change: "",
  reason: "",
};

const STOCK_SNAPSHOT_LIMIT = 8;

function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchInventoryMovements() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/inventory-movements");
      setInventoryMovements(response.data?.data?.inventoryMovements || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load inventory movements."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      setProductsLoading(true);
      setProductError("");

      const response = await apiClient.get("/products");
      setProducts(response.data?.data?.products || []);
    } catch (error) {
      setProductError(
        error.response?.data?.message || "Failed to load inventory stock data."
      );
    } finally {
      setProductsLoading(false);
    }
  }

  async function refreshInventoryPage() {
    await Promise.all([fetchInventoryMovements(), fetchProducts()]);
  }

  useEffect(() => {
    refreshInventoryPage();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleOpenAdjustmentForm() {
    setFormData(initialFormData);
    setCreateError("");
    setSuccessMessage("");
    setIsAdjustmentFormOpen(true);
  }

  function handleCloseAdjustmentForm() {
    setFormData(initialFormData);
    setCreateError("");
    setIsAdjustmentFormOpen(false);
  }

  async function handleCreateAdjustment(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setSuccessMessage("");

      if (!formData.product_id) {
        setCreateError("Please select a product.");
        setCreating(false);
        return;
      }

      if (!formData.quantity_change || Number(formData.quantity_change) === 0) {
        setCreateError("Quantity change must not be zero.");
        setCreating(false);
        return;
      }

      const adjustmentData = {
        product_id: Number(formData.product_id),
        quantity_change: Number(formData.quantity_change),
        reason: formData.reason || null,
      };

      await apiClient.post("/inventory-movements", adjustmentData);

      setFormData(initialFormData);
      setIsAdjustmentFormOpen(false);
      setSuccessMessage("Inventory adjustment created successfully.");

      await refreshInventoryPage();
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to create inventory adjustment."
      );
    } finally {
      setCreating(false);
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

  function formatMovementType(type) {
    if (!type) {
      return "-";
    }

    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getStockLevel(product) {
    const stockQuantity = Number(product.stock_quantity || 0);
    const lowStockLevel = Number(product.low_stock_level || 0);

    if (stockQuantity <= 0) {
      return "out";
    }

    if (stockQuantity <= lowStockLevel) {
      return "low";
    }

    return "healthy";
  }

  function formatStockStatus(product) {
    const stockLevel = getStockLevel(product);

    if (stockLevel === "out") {
      return "Out of stock";
    }

    if (stockLevel === "low") {
      return "Low stock";
    }

    return "Healthy";
  }

  function getStockBadgeClass(product) {
    const stockLevel = getStockLevel(product);

    if (stockLevel === "out") {
      return "inventory-status-pill status-out";
    }

    if (stockLevel === "low") {
      return "inventory-status-pill status-low";
    }

    return "inventory-status-pill status-healthy";
  }

  function getMovementBadgeClass(type) {
    const movementType = String(type || "").toLowerCase();

    if (movementType === "sale") {
      return "inventory-movement-pill type-sale";
    }

    if (movementType === "adjustment" || movementType === "approved_adjustment") {
      return "inventory-movement-pill type-adjustment";
    }

    if (movementType === "purchase_receive") {
      return "inventory-movement-pill type-receive";
    }

    return "inventory-movement-pill type-default";
  }

  function getQuantityClass(quantityChange) {
    const quantity = Number(quantityChange || 0);

    if (quantity > 0) {
      return "inventory-quantity-pill quantity-positive";
    }

    if (quantity < 0) {
      return "inventory-quantity-pill quantity-negative";
    }

    return "inventory-quantity-pill";
  }

  const totalProducts = products.length;

  const totalStockUnits = products.reduce((total, product) => {
    return total + Number(product.stock_quantity || 0);
  }, 0);

  const lowStockProducts = products.filter((product) => {
    return getStockLevel(product) === "low";
  });

  const outOfStockProducts = products.filter((product) => {
    return getStockLevel(product) === "out";
  });

  const inventoryValue = products.reduce((total, product) => {
    const price = Number(product.price || 0);
    const stockQuantity = Number(product.stock_quantity || 0);

    return total + price * stockQuantity;
  }, 0);

  const alertProducts = [...outOfStockProducts, ...lowStockProducts]
    .sort((a, b) => {
      return Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0);
    })
    .slice(0, 5);

  const remainingAlertCount =
    outOfStockProducts.length + lowStockProducts.length - alertProducts.length;

  const stockSnapshotProducts = [...products].sort((a, b) => {
    const stockPriority = {
      out: 1,
      low: 2,
      healthy: 3,
    };

    const aPriority = stockPriority[getStockLevel(a)];
    const bPriority = stockPriority[getStockLevel(b)];

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0);
  });

  const displayedStockSnapshotProducts = stockSnapshotProducts.slice(
    0,
    STOCK_SNAPSHOT_LIMIT
  );

  const remainingStockSnapshotCount =
    stockSnapshotProducts.length - displayedStockSnapshotProducts.length;

  const totalMovements = inventoryMovements.length;

  const stockIncreases = inventoryMovements.filter((movement) => {
    return Number(movement.quantity_change || 0) > 0;
  });

  const stockDecreases = inventoryMovements.filter((movement) => {
    return Number(movement.quantity_change || 0) < 0;
  });

  const salesMovements = inventoryMovements.filter((movement) => {
    return movement.movement_type === "sale";
  });

  const adjustmentMovements = inventoryMovements.filter((movement) => {
    return (
      movement.movement_type === "adjustment" ||
      movement.movement_type === "approved_adjustment"
    );
  });

  const latestMovement = [...inventoryMovements].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  const movementTypeOptions = [
    ...new Set(
      inventoryMovements
        .map((movement) => movement.movement_type)
        .filter(Boolean)
    ),
  ].sort();

  const displayedMovements = inventoryMovements
    .filter((movement) => {
      const searchableText = `${movement.product_name} ${movement.sku} ${
        movement.movement_type
      } ${movement.reason || ""} ${
        movement.created_by_name || ""
      }`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesType =
        movementTypeFilter === "all" ||
        movement.movement_type === movementTypeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortOption === "quantity-desc") {
        return Number(b.quantity_change || 0) - Number(a.quantity_change || 0);
      }

      if (sortOption === "quantity-asc") {
        return Number(a.quantity_change || 0) - Number(b.quantity_change || 0);
      }

      if (sortOption === "product-asc") {
        return String(a.product_name || "").localeCompare(
          String(b.product_name || "")
        );
      }

      return 0;
    });

  const hasActiveInventoryFilters =
    searchQuery || movementTypeFilter !== "all";

  function resetInventoryFilters() {
    setSearchQuery("");
    setMovementTypeFilter("all");
    setSortOption("newest");
  }

  return (
    <section className="inventory-page">
      <header className="inventory-command-bar">
        <div>
          <span className="inventory-eyebrow">Stock control</span>
          <h1>Inventory</h1>
          <p>
            Monitor stock health, review reorder risk, and track every stock
            movement created by sales, purchasing, approvals, and adjustments.
          </p>
        </div>

        <div className="inventory-command-actions">
          <button
            type="button"
            className="inventory-secondary-command"
            onClick={refreshInventoryPage}
            disabled={loading || productsLoading}
          >
            <FiRefreshCw />
            Refresh
          </button>

          <Link to="/products" className="inventory-secondary-command">
            Manage products
            <FiExternalLink />
          </Link>

          <Link to="/approvals" className="inventory-secondary-command">
            <FiShield />
            Request adjustment
          </Link>

          {isAdmin && (
            <button
              type="button"
              className="inventory-primary-command"
              onClick={handleOpenAdjustmentForm}
            >
              <FiSliders />
              Direct adjustment
            </button>
          )}
        </div>
      </header>

      {!isAdmin && (
        <p className="inventory-info-message">
          You can view inventory status and movement history. Use Request
          adjustment for stock changes. Stock changes are applied after Admin
          approval.
        </p>
      )}

      {(productError || successMessage) && (
        <div className="inventory-message-stack">
          {productError && <p className="message error-message">{productError}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="inventory-kpi-strip" aria-label="Inventory metrics">
        <article className="inventory-kpi-card">
          <div className="inventory-kpi-icon">
            <FiBox />
          </div>

          <div>
            <span>Total products</span>
            <strong>{productsLoading ? "..." : totalProducts}</strong>
            <p>Catalogue items</p>
          </div>
        </article>

        <article className="inventory-kpi-card">
          <div className="inventory-kpi-icon">
            <FiPackage />
          </div>

          <div>
            <span>Stock units</span>
            <strong>{productsLoading ? "..." : totalStockUnits}</strong>
            <p>Units on hand</p>
          </div>
        </article>

        <article className="inventory-kpi-card warning">
          <div className="inventory-kpi-icon">
            <FiAlertTriangle />
          </div>

          <div>
            <span>Low stock</span>
            <strong>{productsLoading ? "..." : lowStockProducts.length}</strong>
            <p>Below reorder level</p>
          </div>
        </article>

        <article className="inventory-kpi-card danger">
          <div className="inventory-kpi-icon">
            <FiMinusCircle />
          </div>

          <div>
            <span>Out of stock</span>
            <strong>{productsLoading ? "..." : outOfStockProducts.length}</strong>
            <p>Critical items</p>
          </div>
        </article>

        <article className="inventory-kpi-card">
          <div className="inventory-kpi-icon">
            <FiArchive />
          </div>

          <div>
            <span>Inventory value</span>
            <strong>{productsLoading ? "..." : formatCurrency(inventoryValue)}</strong>
            <p>Price × stock</p>
          </div>
        </article>

        <article className="inventory-kpi-card">
          <div className="inventory-kpi-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest movement</span>
            <strong>
              {latestMovement ? formatShortDate(latestMovement.created_at) : "-"}
            </strong>
            <p>Most recent stock event</p>
          </div>
        </article>
      </section>

      <div className="inventory-overview-grid">
        <section className="inventory-alert-panel">
          <div className="inventory-panel-header">
            <div>
              <span>Reorder attention</span>
              <h2>
                <FiAlertTriangle />
                {outOfStockProducts.length + lowStockProducts.length} products need attention
              </h2>
              <p>Products that are below reorder point or out of stock.</p>
            </div>
          </div>

          <div className="inventory-alert-list">
            {productsLoading ? (
              <div className="inventory-empty-inline">
                <FiPackage />
                <div>
                  <strong>Loading stock alerts</strong>
                  <p>Checking current stock levels.</p>
                </div>
              </div>
            ) : alertProducts.length === 0 ? (
              <div className="inventory-empty-inline">
                <FiPackage />
                <div>
                  <strong>Stock levels look healthy</strong>
                  <p>No products are currently low stock or out of stock.</p>
                </div>
              </div>
            ) : (
              <>
                {alertProducts.map((product) => {
                  const stockQuantity = Number(product.stock_quantity || 0);
                  const lowStockLevel = Number(product.low_stock_level || 0);
                  const isOutOfStock = stockQuantity <= 0;

                  return (
                    <article
                      key={product.id}
                      className={
                        isOutOfStock
                          ? "inventory-alert-row critical"
                          : "inventory-alert-row warning"
                      }
                    >
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.sku} · Reorder point {lowStockLevel}</p>
                      </div>

                      <div>
                        <span>On hand: {stockQuantity}</span>
                        <strong>{isOutOfStock ? "Out" : "Low"}</strong>
                      </div>
                    </article>
                  );
                })}

                {remainingAlertCount > 0 && (
                  <p className="inventory-more-text">
                    + {remainingAlertCount} more product(s) need attention.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="inventory-rules-card">
          <div className="inventory-panel-header">
            <div>
              <span>Control rules</span>
              <h2>
                <FiSliders />
                Stock movement policy
              </h2>
              <p>How stock changes are controlled in this ERP.</p>
            </div>
          </div>

          <div className="inventory-rule-list">
            <article>
              <FiPackage />
              <div>
                <strong>Products hold catalogue data</strong>
                <p>Name, SKU, category, price, current stock, and reorder point.</p>
              </div>
            </article>

            <article>
              <FiActivity />
              <div>
                <strong>Movements create the stock history</strong>
                <p>Sales, purchase receiving, approved changes, and Admin corrections are traceable.</p>
              </div>
            </article>

            <article>
              <FiShield />
              <div>
                <strong>Staff requests need approval</strong>
                <p>Non-admin users request changes through the approval workflow.</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section className="inventory-workspace">
        <div className="inventory-workspace-header">
          <div>
            <span>Stock snapshot</span>
            <h2>Priority stock items</h2>
            <p>
              Read-only stock view sorted by stock status and quantity on hand.
            </p>
          </div>

          <Link to="/products" className="inventory-secondary-command">
            Manage products
            <FiExternalLink />
          </Link>
        </div>

        <div className="inventory-table-area">
          {productsLoading ? (
            <div className="inventory-empty-state">
              <FiBox />
              <h3>Loading stock snapshot</h3>
              <p>Please wait while product stock data is loaded.</p>
            </div>
          ) : productError ? (
            <div className="inventory-empty-state">
              <FiAlertTriangle />
              <h3>Could not load stock data</h3>
              <p>{productError}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="inventory-empty-state">
              <FiBox />
              <h3>No products found</h3>
              <p>Create products first to start tracking stock levels.</p>
            </div>
          ) : (
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>On hand</th>
                    <th>Reorder level</th>
                    <th>Status</th>
                    <th>Est. retail value</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedStockSnapshotProducts.map((product) => {
                    const stockQuantity = Number(product.stock_quantity || 0);
                    const price = Number(product.price || 0);
                    const estimatedValue = stockQuantity * price;

                    return (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                        </td>

                        <td>
                          <span className="inventory-code-pill">{product.sku}</span>
                        </td>

                        <td>{product.category || "-"}</td>

                        <td>
                          <strong>{stockQuantity}</strong>
                        </td>

                        <td>{product.low_stock_level}</td>

                        <td>
                          <span className={getStockBadgeClass(product)}>
                            {formatStockStatus(product)}
                          </span>
                        </td>

                        <td>
                          <strong>{formatCurrency(estimatedValue)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {remainingStockSnapshotCount > 0 && (
                <p className="inventory-more-text">
                  Showing the top {STOCK_SNAPSHOT_LIMIT} priority stock items.{" "}
                  {remainingStockSnapshotCount} more product(s) are available on
                  the Products page.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="inventory-workspace">
        <div className="inventory-workspace-header">
          <div>
            <span>Movement history</span>
            <h2>Inventory movements</h2>
            <p>
              {loading
                ? "Loading inventory movements..."
                : `Showing ${displayedMovements.length} of ${inventoryMovements.length} movements.`}
            </p>

            <div className="inventory-stat-strip">
              <span>
                <strong>{totalMovements}</strong> total
              </span>

              <span className="positive">
                <strong>{stockIncreases.length}</strong> increases
              </span>

              <span className="negative">
                <strong>{stockDecreases.length}</strong> decreases
              </span>

              <span>
                <strong>{salesMovements.length}</strong> sales
              </span>

              <span>
                <strong>{adjustmentMovements.length}</strong> adjustments
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchInventoryMovements}
            className="inventory-secondary-command"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className="inventory-toolbar">
          <div className="inventory-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by product, SKU, type, reason, or user"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search inventory movements"
            />
          </div>

          <select
            value={movementTypeFilter}
            onChange={(event) => setMovementTypeFilter(event.target.value)}
            aria-label="Filter inventory movements by type"
          >
            <option value="all">All types</option>
            {movementTypeOptions.map((type) => (
              <option key={type} value={type}>
                {formatMovementType(type)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort inventory movements"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="quantity-desc">Quantity high-low</option>
            <option value="quantity-asc">Quantity low-high</option>
            <option value="product-asc">Product A-Z</option>
          </select>

          {hasActiveInventoryFilters && (
            <button
              type="button"
              onClick={resetInventoryFilters}
              className="inventory-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="inventory-table-area">
          {loading ? (
            <div className="inventory-empty-state">
              <FiActivity />
              <h3>Loading movement history</h3>
              <p>Please wait while inventory movements are loaded.</p>
            </div>
          ) : error ? (
            <div className="inventory-empty-state">
              <FiAlertTriangle />
              <h3>Could not load movements</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchInventoryMovements}
                className="inventory-primary-command"
              >
                Try again
              </button>
            </div>
          ) : inventoryMovements.length === 0 ? (
            <div className="inventory-empty-state">
              <FiBox />
              <h3>No inventory movements found</h3>
              <p>Sales fulfilment, receiving, and adjustments will appear here.</p>
            </div>
          ) : displayedMovements.length === 0 ? (
            <div className="inventory-empty-state">
              <FiFilter />
              <h3>No matching movements</h3>
              <p>Try changing your search, movement type, or sort option.</p>

              <button
                type="button"
                onClick={resetInventoryFilters}
                className="inventory-secondary-command"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="inventory-table-wrapper">
              <table className="inventory-table movement-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Quantity change</th>
                    <th>Reason</th>
                    <th>Sales order</th>
                    <th>Created by</th>
                    <th>Created at</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <strong>{movement.product_name}</strong>
                      </td>

                      <td>
                        <span className="inventory-code-pill">{movement.sku}</span>
                      </td>

                      <td>
                        <span className={getMovementBadgeClass(movement.movement_type)}>
                          {formatMovementType(movement.movement_type)}
                        </span>
                      </td>

                      <td>
                        <span className={getQuantityClass(movement.quantity_change)}>
                          {Number(movement.quantity_change || 0) > 0
                            ? `+${movement.quantity_change}`
                            : movement.quantity_change}
                        </span>
                      </td>

                      <td>{movement.reason || "-"}</td>

                      <td>
                        {movement.related_sales_order_id ? (
                          <span className="inventory-code-pill">
                            SO-
                            {String(movement.related_sales_order_id).padStart(
                              4,
                              "0"
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>{movement.created_by_name || "-"}</td>
                      <td>{formatDate(movement.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {isAdjustmentFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card inventory-adjustment-modal">
            <div className="inventory-modal-header">
              <div>
                <span>Inventory adjustment</span>
                <h2>Create direct adjustment</h2>
                <p>
                  Manually increase or decrease stock for inventory correction.
                </p>
              </div>

              <button
                type="button"
                className="inventory-icon-button"
                onClick={handleCloseAdjustmentForm}
                aria-label="Close inventory adjustment form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="inventory-form-grid">
              <div className="form-field inventory-form-full">
                <label htmlFor="product_id">Product</label>
                <select
                  id="product_id"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {product.sku} — Current stock:{" "}
                      {product.stock_quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="quantity_change">Quantity change</label>
                <input
                  id="quantity_change"
                  name="quantity_change"
                  type="number"
                  step="1"
                  value={formData.quantity_change}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="inventory-adjustment-help-card">
                <strong>How quantity change works</strong>
                <p>
                  Use a positive number for received stock or corrections. Use a
                  negative number for damaged, lost, or removed stock.
                </p>
              </div>

              <div className="form-field inventory-form-full">
                <label htmlFor="reason">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Example: Supplier stock received, damaged stock, stock count correction"
                />
              </div>

              {createError && (
                <p className="message error-message inventory-form-full">
                  {createError}
                </p>
              )}

              <div className="inventory-form-actions inventory-form-full">
                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create adjustment"}
                </button>

                <button
                  type="button"
                  onClick={handleCloseAdjustmentForm}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

export default InventoryPage;
