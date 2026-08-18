import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiDownload,
  FiEdit2,
  FiFilter,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTrendingDown,
  FiX,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/products.css";

const initialFormData = {
  name: "",
  sku: "",
  category: "",
  price: "",
  low_stock_level: "",
  image_url: "",
};

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingProductId, setEditingProductId] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [productToDelete, setProductToDelete] = useState(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name-asc");

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/products");
      setProducts(response.data.data.products);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function openCreateProductForm() {
    setEditingProductId(null);
    setFormData(initialFormData);
    setFormError("");
    setDeleteError("");
    setSuccessMessage("");
    setIsProductFormOpen(true);
  }

  function handleEditProduct(product) {
    setEditingProductId(product.id);
    setFormError("");
    setDeleteError("");
    setSuccessMessage("");

    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      price: product.price || "",
      low_stock_level: product.low_stock_level || 0,
      image_url: product.image_url || "",
    });

    setIsProductFormOpen(true);
  }

  function handleCancelEdit() {
    setEditingProductId(null);
    setFormData(initialFormData);
    setFormError("");
    setSuccessMessage("");
    setIsProductFormOpen(false);
  }

  async function handleSubmitProduct(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      const productData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category || null,
        price: Number(formData.price),
        low_stock_level: Number(formData.low_stock_level || 0),
        image_url: formData.image_url || null,
      };

      if (editingProductId) {
        await apiClient.put(`/products/${editingProductId}`, productData);
        setSuccessMessage("Product updated successfully.");
      } else {
        await apiClient.post("/products", productData);
        setSuccessMessage("Product created successfully.");
      }

      setFormData(initialFormData);
      setEditingProductId(null);
      setIsProductFormOpen(false);

      await fetchProducts();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          `Failed to ${editingProductId ? "update" : "create"} product.`
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteProduct(product) {
    setProductToDelete(product);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) {
      return;
    }

    try {
      setDeletingProductId(productToDelete.id);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      await apiClient.delete(`/products/${productToDelete.id}`);

      if (editingProductId === productToDelete.id) {
        setEditingProductId(null);
        setFormData(initialFormData);
      }

      setSuccessMessage("Product deleted successfully.");
      setProductToDelete(null);

      await fetchProducts();
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Failed to delete product."
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleExportProducts() {
    try {
      setExporting(true);
      setExportError("");
      setSuccessMessage("");

      await exportCSV("/exports/products", "products.csv");

      setSuccessMessage("Products CSV exported successfully.");
    } catch (error) {
      setExportError("Failed to export products CSV.");
    } finally {
      setExporting(false);
    }
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

    return "in";
  }

  function getStockStatus(product) {
    const stockLevel = getStockLevel(product);

    if (stockLevel === "out") {
      return {
        label: "Out of stock",
        className: "products-status-pill status-out",
      };
    }

    if (stockLevel === "low") {
      return {
        label: "Low stock",
        className: "products-status-pill status-low",
      };
    }

    return {
      label: "In stock",
      className: "products-status-pill status-in",
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(value || 0));
  }

  function getProductInitials(productName) {
    if (!productName) {
      return "P";
    }

    return productName
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  function renderProductThumbnail(product) {
    if (product.image_url) {
      return (
        <img
          src={product.image_url}
          alt={product.name}
          className="product-thumbnail"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling.style.display = "grid";
          }}
        />
      );
    }

    return null;
  }

  const totalProducts = products.length;

  const outOfStockProducts = products.filter(
    (product) => getStockLevel(product) === "out"
  );

  const lowStockProducts = products.filter(
    (product) => getStockLevel(product) === "low"
  );

  const inStockProducts = products.filter(
    (product) => getStockLevel(product) === "in"
  );

  const inventoryValue = products.reduce((total, product) => {
    const price = Number(product.price || 0);
    const stockQuantity = Number(product.stock_quantity || 0);

    return total + price * stockQuantity;
  }, 0);

  const alertProducts = [...outOfStockProducts, ...lowStockProducts]
    .sort((a, b) => Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0))
    .slice(0, 4);

  const remainingAlertCount =
    outOfStockProducts.length + lowStockProducts.length - alertProducts.length;

  const categoryOptions = [
    ...new Set(products.map((product) => product.category || "Uncategorised")),
  ].sort();

  const displayedProducts = products
    .filter((product) => {
      const category = product.category || "Uncategorised";
      const stockLevel = getStockLevel(product);

      const searchableText = `${product.name} ${product.sku} ${category}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;
      const matchesStock = stockFilter === "all" || stockLevel === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortOption === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortOption === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortOption === "price-asc") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortOption === "price-desc") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (sortOption === "stock-asc") {
        return Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0);
      }

      if (sortOption === "stock-desc") {
        return Number(b.stock_quantity || 0) - Number(a.stock_quantity || 0);
      }

      return 0;
    });

  const hasActiveProductFilters =
    searchQuery || categoryFilter !== "all" || stockFilter !== "all";

  function resetProductFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortOption("name-asc");
  }

  return (
    <section className="products-page">
      <header className="products-command-bar">
        <div>
          <span className="products-eyebrow">Inventory catalogue</span>
          <h1>Products</h1>
          <p>
            Manage product records, pricing, catalogue images, and low-stock
            thresholds. Stock quantities are updated through inventory movements.
          </p>
        </div>

        <div className="products-command-actions">
          <button
            type="button"
            className="products-secondary-command"
            onClick={fetchProducts}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>

          <button
            type="button"
            className="products-secondary-command"
            onClick={handleExportProducts}
            disabled={exporting}
          >
            <FiDownload />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            type="button"
            className="products-primary-command"
            onClick={openCreateProductForm}
          >
            <FiPlus />
            New product
          </button>
        </div>
      </header>

      {(exportError || successMessage) && (
        <div className="products-message-stack">
          {exportError && <p className="message error-message">{exportError}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="products-kpi-strip" aria-label="Product summary">
        <article className="products-kpi-card">
          <span>Total products</span>
          <strong>{totalProducts}</strong>
          <p>Catalogue records</p>
        </article>

        <article className="products-kpi-card">
          <span>In stock</span>
          <strong>{inStockProducts.length}</strong>
          <p>Available products</p>
        </article>

        <article className="products-kpi-card warning">
          <span>Low stock</span>
          <strong>{lowStockProducts.length}</strong>
          <p>Below threshold</p>
        </article>

        <article className="products-kpi-card danger">
          <span>Out of stock</span>
          <strong>{outOfStockProducts.length}</strong>
          <p>Needs action</p>
        </article>

        <article className="products-kpi-card">
          <span>Inventory value</span>
          <strong>{formatCurrency(inventoryValue)}</strong>
          <p>Price × stock</p>
        </article>
      </section>

      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <section className="products-alert-panel">
          <div className="products-alert-header">
            <div>
              <span>Stock alerts</span>
              <h2>
                <FiAlertTriangle />
                {outOfStockProducts.length + lowStockProducts.length} products need attention
              </h2>
            </div>

            <button
              type="button"
              className="products-secondary-command"
              onClick={() => {
                setStockFilter("out");
                setSearchQuery("");
                setCategoryFilter("all");
              }}
            >
              View critical
            </button>
          </div>

          <div className="products-alert-list">
            {alertProducts.map((product) => {
              const stockQuantity = Number(product.stock_quantity || 0);
              const isOutOfStock = stockQuantity <= 0;
              const StatusIcon = isOutOfStock ? FiAlertTriangle : FiTrendingDown;

              return (
                <article
                  key={product.id}
                  className={
                    isOutOfStock
                      ? "products-alert-row critical"
                      : "products-alert-row warning"
                  }
                >
                  <StatusIcon />

                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {product.sku} · Stock {stockQuantity} · Reorder level{" "}
                      {product.low_stock_level}
                    </p>
                  </div>

                  <span>{isOutOfStock ? "Critical" : "Low"}</span>
                </article>
              );
            })}

            {remainingAlertCount > 0 && (
              <article className="products-alert-row muted">
                <FiPackage />

                <div>
                  <strong>{remainingAlertCount} more product(s)</strong>
                  <p>Use the table filters to review all stock alerts.</p>
                </div>
              </article>
            )}
          </div>
        </section>
      )}

      <section className="products-workspace">
        <div className="products-workspace-header">
          <div>
            <span>Product list</span>
            <h2>All products</h2>
            <p>
              {loading
                ? "Loading products..."
                : `Showing ${displayedProducts.length} of ${products.length} products.`}
            </p>
          </div>
        </div>

        <div className="products-toolbar">
          <div className="products-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, SKU, or category"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search products"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter products by category"
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            aria-label="Filter products by stock status"
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort products"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price low-high</option>
            <option value="price-desc">Price high-low</option>
            <option value="stock-asc">Stock low-high</option>
            <option value="stock-desc">Stock high-low</option>
          </select>

          {hasActiveProductFilters && (
            <button
              type="button"
              onClick={resetProductFilters}
              className="products-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="products-table-area">
          {deleteError && <p className="message error-message">{deleteError}</p>}

          {loading ? (
            <div className="products-empty-state">
              <FiPackage />
              <h3>Loading products</h3>
              <p>Please wait while the catalogue is loaded.</p>
            </div>
          ) : error ? (
            <div className="products-empty-state">
              <FiAlertTriangle />
              <h3>Could not load products</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchProducts}
                className="products-primary-command"
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty-state">
              <FiPackage />
              <h3>No products found</h3>
              <p>Create your first product to start managing the catalogue.</p>

              <button
                type="button"
                onClick={openCreateProductForm}
                className="products-primary-command"
              >
                <FiPlus />
                New product
              </button>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="products-empty-state">
              <FiFilter />
              <h3>No matching products</h3>
              <p>Try changing your search, category, stock filter, or sort option.</p>

              <button
                type="button"
                onClick={resetProductFilters}
                className="products-secondary-command"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Reorder level</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedProducts.map((product) => {
                    const stockStatus = getStockStatus(product);

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-name-cell">
                            <div className="product-thumb-frame">
                              {renderProductThumbnail(product)}

                              <div
                                className="product-thumbnail-fallback"
                                style={{
                                  display: product.image_url ? "none" : "grid",
                                }}
                              >
                                {getProductInitials(product.name)}
                              </div>
                            </div>

                            <div>
                              <strong>{product.name}</strong>
                              <p>{product.category || "Uncategorised"}</p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="product-code-pill">{product.sku}</span>
                        </td>

                        <td>{product.category || "-"}</td>
                        <td>{formatCurrency(product.price)}</td>

                        <td>
                          <div className="products-stock-cell">
                            <strong>{product.stock_quantity}</strong>
                            <span className={stockStatus.className}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </td>

                        <td>{product.low_stock_level}</td>

                        <td>
                          <div className="products-table-actions">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="products-icon-action"
                              aria-label={`Edit ${product.name}`}
                            >
                              <FiEdit2 />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              disabled={deletingProductId === product.id}
                              className="products-icon-action danger"
                              aria-label={`Delete ${product.name}`}
                            >
                              <FiTrash2 />
                              <span>
                                {deletingProductId === product.id
                                  ? "Deleting"
                                  : "Delete"}
                              </span>
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
      </section>

      {isProductFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card product-form-modal">
            <div className="products-modal-header">
              <div>
                <span>Product record</span>
                <h2>{editingProductId ? "Edit product" : "New product"}</h2>
                <p>
                  {editingProductId
                    ? "Update product details, pricing, and catalogue image."
                    : "Create a new product record. Opening stock is added from Inventory."}
                </p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCancelEdit}
                aria-label="Close product form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="products-form-grid">
              <div className="form-field">
                <label htmlFor="name">Product name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="sku">SKU</label>
                <input
                  id="sku"
                  name="sku"
                  type="text"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field products-form-full">
                <label htmlFor="image_url">Product image URL</label>
                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/product-image.jpg"
                />
              </div>

              <div className="form-field">
                <label htmlFor="low_stock_level">Low stock level</label>
                <input
                  id="low_stock_level"
                  name="low_stock_level"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.low_stock_level}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Stock quantity</label>

                <div className="readonly-stock-box">
                  {editingProductId ? (
                    <>
                      <strong>
                        Current stock:{" "}
                        {products.find((product) => product.id === editingProductId)
                          ?.stock_quantity ?? 0}
                      </strong>
                      <p>Stock changes are managed through the Inventory page.</p>
                    </>
                  ) : (
                    <>
                      <strong>New products start with stock 0</strong>
                      <p>Add opening stock using Inventory → New Adjustment.</p>
                    </>
                  )}
                </div>
              </div>

              {formError && (
                <p className="message error-message products-form-full">
                  {formError}
                </p>
              )}

              <div className="products-form-actions products-form-full">
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingProductId
                      ? "Updating..."
                      : "Creating..."
                    : editingProductId
                    ? "Update product"
                    : "Create product"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Delete product?"
        message={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Product"
        isLoading={deletingProductId === productToDelete?.id}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </section>
  );
}

export default ProductsPage;
