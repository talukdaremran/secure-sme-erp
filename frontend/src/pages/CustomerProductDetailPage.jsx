import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTag,
  FiTruck,
} from "react-icons/fi";

import portalApiClient from "../api/portalApiClient";
import { useCustomerCart } from "../context/CustomerCartContext";

function CustomerProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCustomerCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProduct() {
    try {
      setLoading(true);
      setError("");

      const response = await portalApiClient.get(
        `/customer-portal/products/${id}`
      );

      setProduct(response.data?.data?.product || null);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load product details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProduct();
  }, [id]);

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

  function increaseQuantity() {
    setQuantity((currentQuantity) => {
      const stockQuantity = Number(product?.stock_quantity || 1);
      return Math.min(currentQuantity + 1, stockQuantity);
    });
  }

  function decreaseQuantity() {
    setQuantity((currentQuantity) => Math.max(currentQuantity - 1, 1));
  }

  function handleAddToCart() {
    for (let count = 0; count < quantity; count += 1) {
      addToCart(product);
    }

    setSuccessMessage(`${quantity} × ${product.name} added to cart.`);
  }

  if (loading) {
    return (
      <section className="cf-product-detail-page">
        <div className="cf-detail-state">
          <FiBox />
          <p>Loading product details...</p>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="cf-product-detail-page">
        <div className="cf-detail-state">
          <FiBox />
          <h2>Product unavailable</h2>
          <p>{error || "This product could not be loaded."}</p>

          <button type="button" onClick={() => navigate("/customer/products")}>
            Back to products
          </button>
        </div>
      </section>
    );
  }

  const stockQuantity = Number(product.stock_quantity || 0);
  const lowStockLevel = Number(product.low_stock_level || 0);
  const isLowStock = stockQuantity <= lowStockLevel;
  const category = product.category || "General";

  return (
    <section className="cf-product-detail-page">
      <Link to="/customer/products" className="cf-detail-back-link">
        <FiArrowLeft />
        Back to products
      </Link>

      {successMessage && (
        <p className="message success-message cf-shop-message">
          {successMessage}
        </p>
      )}

      <div className="cf-detail-shell">
        <div className="cf-detail-media-panel">
          <div className="cf-detail-image-wrap">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="cf-detail-image"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.nextElementSibling.style.display = "grid";
                }}
              />
            ) : null}

            <div
              className="cf-detail-image-fallback"
              style={{ display: product.image_url ? "none" : "grid" }}
            >
              {getProductInitials(product.name)}
            </div>

            <span className="cf-detail-category-badge">{category}</span>
          </div>
        </div>

        <div className="cf-detail-info-panel">
          <span className="cf-detail-eyebrow">Product Details</span>

          <h1>{product.name}</h1>

          <div className="cf-detail-meta-row">
            <span>
              <FiTag />
              SKU {product.sku}
            </span>

            <span className={isLowStock ? "low" : ""}>
              <FiCheckCircle />
              {stockQuantity} available
            </span>
          </div>

          <p className="cf-detail-description">
            Available for customer ordering through the CoreFlow portal. Add the
            required quantity to your cart and submit the order for staff
            fulfilment.
          </p>

          <div className="cf-detail-price-card">
            <div>
              <span>Price</span>
              <strong>{formatCurrency(product.price)}</strong>
            </div>

            <p>GST and invoice handling are managed after order submission.</p>
          </div>

          <div className="cf-detail-purchase-box">
            <div className="cf-quantity-control">
              <button type="button" onClick={decreaseQuantity}>
                <FiMinus />
              </button>

              <strong>{quantity}</strong>

              <button type="button" onClick={increaseQuantity}>
                <FiPlus />
              </button>
            </div>

            <button type="button" className="cf-detail-add-button" onClick={handleAddToCart}>
              <FiShoppingCart />
              Add to cart
            </button>
          </div>

          <div className="cf-detail-trust-grid">
            <article>
              <FiTruck />
              <div>
                <strong>Staff fulfilment</strong>
                <p>Stock is deducted after delivery confirmation.</p>
              </div>
            </article>

            <article>
              <FiCheckCircle />
              <div>
                <strong>Live availability</strong>
                <p>Only products with available stock are shown.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CustomerProductDetailPage;