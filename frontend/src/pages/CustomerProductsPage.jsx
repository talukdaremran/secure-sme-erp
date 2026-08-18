import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
} from "react-icons/fi";

import portalApiClient from "../api/portalApiClient";
import { useCustomerCart } from "../context/CustomerCartContext";

function CustomerProductsPage() {
  const { addToCart } = useCustomerCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOption, setSortOption] = useState("stock-desc");

  async function fetchProducts(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await portalApiClient.get("/customer-portal/products");
      setProducts(response.data?.data?.products || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const categoryOptions = useMemo(() => {
    return [
      ...new Set(products.map((product) => product.category || "General")),
    ].sort();
  }, [products]);

  const displayedProducts = useMemo(() => {
    return products
      .filter((product) => {
        const category = product.category || "General";
        const searchableText =
          `${product.name} ${product.sku} ${category}`.toLowerCase();

        const matchesSearch = searchableText.includes(
          searchQuery.trim().toLowerCase()
        );

        const matchesCategory =
          categoryFilter === "all" || category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortOption === "stock-desc") {
          return Number(b.stock_quantity || 0) - Number(a.stock_quantity || 0);
        }

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

        return 0;
      });
  }, [products, searchQuery, categoryFilter, sortOption]);

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

  function getCategoryClass(category) {
    return `cf-category-${String(category || "general")
      .toLowerCase()
      .replaceAll(" ", "-")}`;
  }

  function handleAddToCart(product) {
    addToCart(product);
    setSuccessMessage(`${product.name} added to cart.`);
  }

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortOption("stock-desc");
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all";

  return (
    <section className="cf-shop-page">
      <div className="cf-shop-header">
        <div>
          <span>Product Catalogue</span>
          <h1>Available Products</h1>
          <p>
            {displayedProducts.length} of {products.length} products ready to order.
          </p>
        </div>

        <button
          type="button"
          className="cf-shop-refresh"
          onClick={() => fetchProducts(true)}
          disabled={refreshing}
        >
          <FiRefreshCw />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {successMessage && (
        <p className="message success-message cf-shop-message">
          {successMessage}
        </p>
      )}

      <div className="cf-shop-controls">
        <div className="cf-shop-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search products, SKU, or category..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <select
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value)}
        >
          <option value="stock-desc">Most Available</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price Low-High</option>
          <option value="price-desc">Price High-Low</option>
        </select>

        {hasActiveFilters && (
          <button type="button" className="secondary-button" onClick={resetFilters}>
            Reset
          </button>
        )}
      </div>

      <div className="cf-shop-categories">
        <button
          type="button"
          className={categoryFilter === "all" ? "active" : ""}
          onClick={() => setCategoryFilter("all")}
        >
          All
          <strong>{products.length}</strong>
        </button>

        {categoryOptions.map((category) => {
          const count = products.filter(
            (product) => (product.category || "General") === category
          ).length;

          return (
            <button
              key={category}
              type="button"
              className={categoryFilter === category ? "active" : ""}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="cf-shop-state">
          <FiBox />
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <FiBox />
          <h3>No products available</h3>
          <p>Products with available stock will appear here.</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="empty-state">
          <FiSearch />
          <h3>No matching products</h3>
          <p>Try changing the search term or selected category.</p>
          <button type="button" className="secondary-button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="cf-shop-grid">
          {displayedProducts.map((product) => {
            const stockQuantity = Number(product.stock_quantity || 0);
            const lowStockLevel = Number(product.low_stock_level || 0);
            const isLowStock = stockQuantity <= lowStockLevel;
            const category = product.category || "General";

            return (
              <article
                key={product.id}
                className={`cf-product-card ${getCategoryClass(category)}`}
              >
                <Link to={`/customer/products/${product.id}`} className="cf-product-image-wrap">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="cf-product-image"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling.style.display =
                          "grid";
                      }}
                    />
                  ) : null}

                  <div
                    className="cf-product-fallback"
                    style={{ display: product.image_url ? "none" : "grid" }}
                  >
                    {getProductInitials(product.name)}
                  </div>

                  <span className="cf-product-category">{category}</span>

                  <span className={isLowStock ? "cf-product-stock low" : "cf-product-stock"}>
                    {stockQuantity} left
                  </span>
                </Link>

                <div className="cf-product-body">
                  <span className="cf-product-sku">{product.sku}</span>
                  <Link to={`/customer/products/${product.id}`}>{product.name}</Link>
                </div>

                <div className="cf-product-footer">
                  <strong>{formatCurrency(product.price)}</strong>

                  <button type="button" onClick={() => handleAddToCart(product)}>
                    <FiShoppingCart />
                    Add
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CustomerProductsPage;