import { useEffect, useState } from "react";
import { FiBox, FiShoppingCart } from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";
import { useCustomerCart } from "../context/CustomerCartContext";

function CustomerProductsPage() {
  const { addToCart } = useCustomerCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await portalApiClient.get("/customer-portal/products");
      setProducts(response.data?.data?.products || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(value || 0));
  }

  function handleAddToCart(product) {
    addToCart(product);
    setSuccessMessage(`${product.name} added to cart.`);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <section className="customer-portal-page">
      <div className="page-header">
        <div>
          <h2>Browse Products</h2>
          <p>Select products and add them to your cart.</p>
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}
      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <FiBox />
          <h3>No products available</h3>
          <p>Products with available stock will appear here.</p>
        </div>
      ) : (
        <div className="customer-product-grid">
          {products.map((product) => (
            <article key={product.id} className="customer-product-card">
              <div>
                <span className="code-pill">{product.sku}</span>
                <h3>{product.name}</h3>
                <p>{product.category || "General"}</p>
              </div>

              <div className="customer-product-meta">
                <strong>{formatCurrency(product.price)}</strong>
                <span>Available: {product.stock_quantity}</span>
              </div>

              <button type="button" onClick={() => handleAddToCart(product)}>
                <FiShoppingCart />
                Add to Cart
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CustomerProductsPage;