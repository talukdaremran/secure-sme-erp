import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiTrash2 } from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";
import { useCustomerCart } from "../context/CustomerCartContext";
import { useState } from "react";

const GST_RATE = 0.1;

function CustomerCartPage() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCustomerCart();

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
    <section className="customer-portal-page">
      <div className="page-header">
        <div>
          <h2>Your Cart</h2>
          <p>Review your items before placing the order.</p>
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <FiShoppingCart />
          <h3>Your cart is empty</h3>
          <p>Add products from the product browsing page.</p>

          <Link to="/customer/products" className="secondary-button page-link-button">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="customer-cart-grid">
          <section className="table-card">
            <div className="table-card-header">
              <div>
                <h2>Cart Items</h2>
                <p>{cartItems.length} product(s) selected.</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Line Total</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>
                        <span className="code-pill">{item.sku}</span>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        <input
                          className="cart-quantity-input"
                          type="number"
                          min="1"
                          max={item.stock_quantity}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(item.id, event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <strong>
                          {formatCurrency(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <FiTrash2 />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="customer-cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>

            <div className="summary-row">
              <span>GST</span>
              <strong>{formatCurrency(gstAmount)}</strong>
            </div>

            <div className="summary-row total-row">
              <span>Total</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>

            <p>
              Stock will be updated after staff confirms delivery in the ERP.
            </p>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CustomerCartPage;