import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiPackage,
  FiTrendingDown,
  FiX,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import { exportCSV } from "../utils/exportCSV";
import ConfirmModal from "../components/ConfirmModal";

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

    window.scrollTo({ top: 0, behavior: "smooth" });
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
        className: "badge badge-danger",
      };
    }

    if (stockLevel === "low") {
      return {
        label: "Low stock",
        className: "badge badge-warning",
      };
    }

    return {
      label: "In stock",
      className: "badge badge-success",
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(value || 0));
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
    .slice(0, 6);

  const remainingAlertCount =
    outOfStockProducts.length + lowStockProducts.length - alertProducts.length;

  const categoryOptions = [
    ...new Set(
      products.map((product) => product.category || "Uncategorised")
    ),
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

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>
            Manage product details, pricing, and low stock thresholds. Stock changes are handled from Inventory.
          </p>
        </div>

        {/* Add new Product button */}
        <div className="page-actions">
          <button type="button" onClick={handleExportProducts} disabled={exporting}>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProductId(null);
              setFormData(initialFormData);
              setFormError("");
              setIsProductFormOpen(true);
            }}
          >
            + New Product
          </button>
        </div>
      </div>

      {exportError && <p className="message error-message">{exportError}</p>}
      {successMessage && <p className="message success-message">{successMessage}</p>}

      {/* Add New Product Modal Form */}
      {isProductFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card product-form-modal">
            <div className="modal-header">
              <div>
                <h2>{editingProductId ? "Edit Product" : "Add New Product"}</h2>
                <p>
                  {editingProductId
                    ? "Update product details, pricing, and stock information."
                    : "Add a new product to the ERP inventory."}
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

            <form onSubmit={handleSubmitProduct} className="form-grid">
              <div className="form-field">
                <label htmlFor="name">Product Name</label>
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

              <div className="form-field form-full-width">
                <label htmlFor="image_url">Product Image URL</label>
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

              <div className="form-field stock-managed-note">
                <label>Stock Quantity</label>

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

              <div className="form-field">
                <label htmlFor="low_stock_level">Low Stock Level</label>
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

              {formError && (
                <p className="message error-message full-width">{formError}</p>
              )}

              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingProductId
                      ? "Updating..."
                      : "Creating..."
                    : editingProductId
                    ? "Update Product"
                    : "Create Product"}
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

      {/* Products-only summary cards */}
      <div className="product-summary-grid">
        <article className="product-summary-card">
          <span>Total Products</span>
          <strong>{totalProducts}</strong>
        </article>

        <article className="product-summary-card">
          <span>In Stock</span>
          <strong>{inStockProducts.length}</strong>
        </article>

        <article className="product-summary-card warning-card">
          <span>Low Stock</span>
          <strong>{lowStockProducts.length}</strong>
        </article>

        <article className="product-summary-card danger-card">
          <span>Out of Stock</span>
          <strong>{outOfStockProducts.length}</strong>
        </article>

        <article className="product-summary-card">
          <span>Inventory Value</span>
          <strong>{formatCurrency(inventoryValue)}</strong>
        </article>
      </div>

      {/* stock alert section */}
      <section className="panel product-alert-panel">
        <div className="panel-header product-alert-header">
          <div>
            <h2>
              <FiAlertTriangle />
              Stock Alerts ({outOfStockProducts.length + lowStockProducts.length})
            </h2>
            <p>Critical and low stock products that need attention.</p>
          </div>
        </div>

        <div className="panel-body">
          {alertProducts.length === 0 ? (
            <div className="empty-state">
              <FiPackage />
              <h3>Stock levels look healthy</h3>
              <p>No products are currently low stock or out of stock.</p>
            </div>
          ) : (
            <>
              <div className="product-alert-list">
                {alertProducts.map((product) => {
                  const stockQuantity = Number(product.stock_quantity || 0);
                  const isOutOfStock = stockQuantity <= 0;

                  const StatusIcon = isOutOfStock
                    ? FiAlertTriangle
                    : FiTrendingDown;

                  return (
                    <div
                      key={product.id}
                      className={
                        isOutOfStock
                          ? "product-alert-item critical-alert"
                          : "product-alert-item low-stock-alert"
                      }
                    >
                      <div className="product-alert-top">
                        <div>
                          <strong>{product.name}</strong>
                          <p>{product.sku}</p>
                        </div>

                        <StatusIcon />
                      </div>

                      <div className="product-alert-bottom">
                        <span>Stock: {stockQuantity}</span>

                        <span
                          className={
                            isOutOfStock
                              ? "badge badge-danger"
                              : "badge badge-warning"
                          }
                        >
                          {isOutOfStock ? "Critical" : "Low Stock"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {remainingAlertCount > 0 && (
                <p className="alert-more-text">
                  + {remainingAlertCount} more product(s) need attention. Check the
                  product table for full details.
                </p>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* Products Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>All Products</h2>
            <p>
              {loading
                ? "Loading products..."
                : `Showing ${displayedProducts.length} of ${products.length} products.`}
            </p>
          </div>
        </div>

        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search products"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter products by category"
          >
            <option value="all">All Categories</option>
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
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort products"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="stock-asc">Stock Low-High</option>
            <option value="stock-desc">Stock High-Low</option>
          </select>

          {hasActiveProductFilters && (
            <button
              type="button"
              onClick={resetProductFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {deleteError && <p className="message error-message">{deleteError}</p>}

          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchProducts}>
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Create your first product using the form above.</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="empty-state">
              <h3>No matching products found</h3>
              <p>Try changing your search, category, stock filter, or sort option.</p>
              <button
                type="button"
                onClick={resetProductFilters}
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
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Low Stock Level</th>
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
                                style={{ display: product.image_url ? "none" : "grid" }}
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
                          <span className="code-pill">{product.sku}</span>
                        </td>

                        <td>{product.category || "-"}</td>

                        <td>{formatCurrency(product.price)}</td>

                        <td>
                          <div className="stock-cell">
                            <strong>{product.stock_quantity}</strong>
                            <span className={stockStatus.className}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </td>

                        <td>{product.low_stock_level}</td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="secondary-button"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              disabled={deletingProductId === product.id}
                              className="danger-button"
                            >
                              {deletingProductId === product.id
                                ? "Deleting..."
                                : "Delete"}
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
      
      {/* Confirm Delete modal */}
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