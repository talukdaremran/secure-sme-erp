import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiArchive,
  FiBox,
  FiClock,
  FiExternalLink,
  FiMinusCircle,
  FiPackage,
  FiRefreshCw,
  FiShoppingCart,
  FiSliders,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

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

  useEffect(() => {
    fetchInventoryMovements();
    fetchProducts();
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

      await fetchInventoryMovements();
      await fetchProducts();
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
      return "Out of Stock";
    }

    if (stockLevel === "low") {
      return "Low Stock";
    }

    return "Healthy";
  }

  function getStockBadgeClass(product) {
    const stockLevel = getStockLevel(product);

    if (stockLevel === "out") {
      return "badge badge-danger";
    }

    if (stockLevel === "low") {
      return "badge badge-warning";
    }

    return "badge badge-success";
  }

  function getMovementBadgeClass(type) {
    const movementType = String(type || "").toLowerCase();

    if (movementType === "sale") {
      return "badge badge-warning";
    }

    if (movementType === "adjustment") {
      return "badge badge-info";
    }

    return "badge badge-success";
  }

  function getQuantityClass(quantityChange) {
    const quantity = Number(quantityChange || 0);

    if (quantity > 0) {
      return "quantity-pill quantity-positive";
    }

    if (quantity < 0) {
      return "quantity-pill quantity-negative";
    }

    return "quantity-pill";
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
    .slice(0, 6);

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
    return movement.movement_type === "adjustment";
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
    <section>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>
            Monitor stock health, review inventory alerts, and track every stock
            movement.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/products" className="secondary-button page-link-button">
            Manage Products
            <FiExternalLink />
          </Link>

          {isAdmin && (
            <button type="button" onClick={handleOpenAdjustmentForm}>
              + New Adjustment
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <p className="message info-message">
          You can view inventory status and movement history. Manual stock
          adjustments are available to Admin users only.
        </p>
      )}

      {productError && <p className="message error-message">{productError}</p>}

      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      {/* Inventory Metrics */}
      <div className="dashboard-metric-grid">
        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiBox />
          </div>

          <div>
            <span>Total Products</span>
            <strong>{productsLoading ? "..." : totalProducts}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-purple">
          <div className="metric-icon">
            <FiPackage />
          </div>

          <div>
            <span>Total Stock Units</span>
            <strong>{productsLoading ? "..." : totalStockUnits}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiAlertTriangle />
          </div>

          <div>
            <span>Low Stock Items</span>
            <strong>{productsLoading ? "..." : lowStockProducts.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-red">
          <div className="metric-icon">
            <FiMinusCircle />
          </div>

          <div>
            <span>Out of Stock</span>
            <strong>{productsLoading ? "..." : outOfStockProducts.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiArchive />
          </div>

          <div>
            <span>Inventory Value</span>
            <strong>{productsLoading ? "..." : formatCurrency(inventoryValue)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest Movement</span>
            <strong>
              {latestMovement ? formatShortDate(latestMovement.created_at) : "-"}
            </strong>
          </div>
        </article>
      </div>

      {/* Inventory control overview */}
      <div className="inventory-control-grid">
        <section className="panel inventory-alert-panel">
          <div className="panel-header inventory-alert-header">
            <div>
              <h2>
                <FiAlertTriangle />
                Reorder Attention ({outOfStockProducts.length + lowStockProducts.length})
              </h2>
              <p>Products that are below their reorder point or out of stock.</p>
            </div>
          </div>

          <div className="panel-body">
            {productsLoading ? (
              <p>Loading stock alerts...</p>
            ) : alertProducts.length === 0 ? (
              <div className="compact-empty-state">
                <FiPackage />
                <div>
                  <strong>Stock levels look healthy</strong>
                  <p>No products are currently low stock or out of stock.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="compact-alert-list">
                  {alertProducts.map((product) => {
                    const stockQuantity = Number(product.stock_quantity || 0);
                    const lowStockLevel = Number(product.low_stock_level || 0);
                    const isOutOfStock = stockQuantity <= 0;

                    return (
                      <div
                        key={product.id}
                        className={
                          isOutOfStock
                            ? "compact-alert-row critical-alert"
                            : "compact-alert-row low-stock-alert"
                        }
                      >
                        <div>
                          <strong>{product.name}</strong>
                          <p>
                            {product.sku} · Reorder point: {lowStockLevel}
                          </p>
                        </div>

                        <div className="compact-alert-status">
                          <span>On hand: {stockQuantity}</span>
                          <span
                            className={
                              isOutOfStock
                                ? "badge badge-danger"
                                : "badge badge-warning"
                            }
                          >
                            {isOutOfStock ? "Out of Stock" : "Low Stock"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {remainingAlertCount > 0 && (
                  <p className="alert-more-text">
                    + {remainingAlertCount} more product(s) need attention.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="panel inventory-rules-panel">
          <div className="panel-header">
            <div>
              <h2>
                <FiSliders />
                Inventory Control Rules
              </h2>
              <p>How stock changes are controlled in this system.</p>
            </div>
          </div>

          <div className="panel-body">
            <div className="inventory-rule-list">
              <div className="inventory-rule-item">
                <FiPackage />
                <div>
                  <strong>Products store item details</strong>
                  <p>Name, SKU, category, price, stock level, and reorder point.</p>
                </div>
              </div>

              <div className="inventory-rule-item">
                <FiActivity />
                <div>
                  <strong>Inventory records tracked stock changes</strong>
                  <p>Sales deductions and manual adjustments create movement history.</p>
                </div>
              </div>

              <div className="inventory-rule-item">
                <FiShoppingCart />
                <div>
                  <strong>Sales orders deduct stock automatically</strong>
                  <p>Outbound stock movements are created when orders are placed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Stock snapshot card */}
      <section className="table-card stock-snapshot-card">
        <div className="table-card-header">
          <div>
            <h2>Priority Stock Snapshot</h2>
            <p>
              Read-only view of the most urgent stock items, sorted by stock status and
              quantity on hand.
            </p>
          </div>

          <Link to="/products" className="secondary-button page-link-button">
            Manage Products
            <FiExternalLink />
          </Link>
        </div>

        <div className="panel-body">
          {productsLoading ? (
            <p>Loading current stock snapshot...</p>
          ) : productError ? (
            <p className="message error-message">{productError}</p>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <FiBox />
              <h3>No products found</h3>
              <p>Create products first to start tracking inventory stock levels.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>On Hand</th>
                    <th>Low Stock Level</th>
                    <th>Status</th>
                    <th>Est. Retail Value</th>
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
                          <span className="code-pill">{product.sku}</span>
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
                <p className="snapshot-more-text">
                  Showing the top {STOCK_SNAPSHOT_LIMIT} stock priority items.{" "}
                  {remainingStockSnapshotCount} more product(s) are available on the Products
                  page.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Inventory movement Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Movement History</h2>
            <p>
              {loading
                ? "Loading inventory movements..."
                : `Showing ${displayedMovements.length} of ${inventoryMovements.length} movements.`}
            </p>

            <div className="movement-stat-strip">
              <span>
                <strong>{totalMovements}</strong> total
              </span>

              <span className="positive-stat">
                <strong>{stockIncreases.length}</strong> increases
              </span>

              <span className="negative-stat">
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
            className="secondary-button"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className="table-toolbar inventory-table-toolbar">
          <input
            type="text"
            placeholder="Search by product, SKU, type, reason, or user..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search inventory movements"
          />

          <select
            value={movementTypeFilter}
            onChange={(event) => setMovementTypeFilter(event.target.value)}
            aria-label="Filter inventory movements by type"
          >
            <option value="all">All Types</option>
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
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="quantity-desc">Quantity High-Low</option>
            <option value="quantity-asc">Quantity Low-High</option>
            <option value="product-asc">Product A-Z</option>
          </select>

          {hasActiveInventoryFilters && (
            <button
              type="button"
              onClick={resetInventoryFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {loading ? (
            <p>Loading inventory movements...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchInventoryMovements}>
                Try Again
              </button>
            </div>
          ) : inventoryMovements.length === 0 ? (
            <div className="empty-state">
              <FiBox />
              <h3>No inventory movements found</h3>
              <p>Sales orders and manual adjustments will appear here.</p>
            </div>
          ) : displayedMovements.length === 0 ? (
            <div className="empty-state">
              <FiActivity />
              <h3>No matching movements found</h3>
              <p>Try changing your search, movement type, or sort option.</p>

              <button
                type="button"
                onClick={resetInventoryFilters}
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
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Quantity Change</th>
                    <th>Reason</th>
                    <th>Sales Order</th>
                    <th>Created By</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <strong>{movement.product_name}</strong>
                      </td>

                      <td>
                        <span className="code-pill">{movement.sku}</span>
                      </td>

                      <td>
                        <span
                          className={getMovementBadgeClass(
                            movement.movement_type
                          )}
                        >
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
                          <span className="code-pill">
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
      </div>

      {/* Adjustment form modal */}
      {isAdjustmentFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card inventory-adjustment-modal">
            <div className="modal-header">
              <div>
                <h2>Create Inventory Adjustment</h2>
                <p>
                  Manually increase or decrease stock for inventory correction.
                </p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseAdjustmentForm}
                aria-label="Close inventory adjustment form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="form-grid">
              <div className="form-field full-width">
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
                <label htmlFor="quantity_change">Quantity Change</label>
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

              <div className="adjustment-help-card">
                <strong>How quantity change works</strong>
                <p>
                  Use a positive number for received stock or corrections. Use a
                  negative number for damaged, lost, or removed stock.
                </p>
              </div>

              <div className="form-field full-width">
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
                <p className="message error-message full-width">
                  {createError}
                </p>
              )}

              <div className="form-actions">
                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Adjustment"}
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