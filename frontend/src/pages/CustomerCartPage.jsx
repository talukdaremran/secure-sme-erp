import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi";
import { useState } from "react";

import portalApiClient from "../api/portalApiClient";
import { useCustomerCart } from "../context/CustomerCartContext";

const GST_RATE = 0.1;

function CustomerCartPage() {
  const navigate = useNavigate();

  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } =
    useCustomerCart();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const gstAmount = Number((cartTotal * GST_RATE).toFixed(2));
  const totalAmount = Number((cartTotal + gstAmount).toFixed(2));

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

  function increaseQuantity(item) {
    const currentQuantity = Number(item.quantity || 1);
    const stockQuantity = Number(item.stock_quantity || currentQuantity);

    updateQuantity(item.id, Math.min(currentQuantity + 1, stockQuantity));
  }

  function decreaseQuantity(item) {
    const currentQuantity = Number(item.quantity || 1);
    updateQuantity(item.id, Math.max(currentQuantity - 1, 1));
  }

  async function handlePlaceOrder() {
    try {
      setPlacingOrder(true);
      setError("");

      const payload = {
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: Number(item.quantity),
        })),
      };

      await portalApiClient.post("/customer-portal/orders", payload);

      clearCart();
      navigate("/customer/orders");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <section className="cf-cart-page">
      <div className="cf-cart-header">
        <div>
          <span>Order Cart</span>
          <h1>Your Cart</h1>
          <p>
            Review selected products, adjust quantities, and submit your order
            for staff fulfilment.
          </p>
        </div>

        <Link to="/customer/products" className="cf-cart-back-link">
          <FiArrowLeft />
          Continue shopping
        </Link>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {cartItems.length === 0 ? (
        <div className="cf-cart-empty">
          <FiShoppingCart />
          <h2>Your cart is empty</h2>
          <p>Add products from the product catalogue before placing an order.</p>

          <Link to="/customer/products">Browse Products</Link>
        </div>
      ) : (
        <div className="cf-cart-layout">
          <section className="cf-cart-items-panel">
            <div className="cf-cart-panel-header">
              <div>
                <h2>Selected Products</h2>
                <p>{cartItems.length} product type(s) in this order.</p>
              </div>

              <button type="button" onClick={clearCart}>
                Clear cart
              </button>
            </div>

            <div className="cf-cart-item-list">
              {cartItems.map((item) => {
                const lineTotal = Number(item.price) * Number(item.quantity);

                return (
                  <article key={item.id} className="cf-cart-item">
                    <div className="cf-cart-item-image">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling.style.display =
                              "grid";
                          }}
                        />
                      ) : null}

                      <div
                        className="cf-cart-item-fallback"
                        style={{ display: item.image_url ? "none" : "grid" }}
                      >
                        {getProductInitials(item.name)}
                      </div>
                    </div>

                    <div className="cf-cart-item-info">
                      <span>{item.sku}</span>
                      <h3>{item.name}</h3>
                      <p>{item.category || "General"}</p>
                    </div>

                    <div className="cf-cart-item-price">
                      <span>Unit price</span>
                      <strong>{formatCurrency(item.price)}</strong>
                    </div>

                    <div className="cf-cart-quantity-control">
                      <button type="button" onClick={() => decreaseQuantity(item)}>
                        <FiMinus />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.stock_quantity}
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(item.id, event.target.value)
                        }
                      />

                      <button type="button" onClick={() => increaseQuantity(item)}>
                        <FiPlus />
                      </button>
                    </div>

                    <div className="cf-cart-item-total">
                      <span>Line total</span>
                      <strong>{formatCurrency(lineTotal)}</strong>
                    </div>

                    <button
                      type="button"
                      className="cf-cart-remove-button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <FiTrash2 />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="cf-cart-summary-panel">
            <div className="cf-cart-summary-icon">
              <FiShoppingBag />
            </div>

            <h2>Order Summary</h2>
            <p className="cf-cart-summary-subtitle">
              Final invoice and stock movement will be handled after staff
              confirms fulfilment.
            </p>

            <div className="cf-cart-summary-rows">
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(cartTotal)}</strong>
              </div>

              <div>
                <span>GST</span>
                <strong>{formatCurrency(gstAmount)}</strong>
              </div>

              <div className="total">
                <span>Total</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="cf-place-order-button"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>

            <p className="cf-cart-summary-note">
              Order status will appear in My Orders after submission.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CustomerCartPage;