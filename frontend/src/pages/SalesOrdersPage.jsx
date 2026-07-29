import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const initialFormData = {
  customer_id: "",
  product_id: "",
  quantity: "",
};

function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchSalesOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/sales-orders");
      setSalesOrders(response.data.data.salesOrders);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load sales orders."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchFormOptions() {
    try {
      const [customersResponse, productsResponse] = await Promise.all([
        apiClient.get("/customers"),
        apiClient.get("/products"),
      ]);

      setCustomers(customersResponse.data.data.customers);
      setProducts(productsResponse.data.data.products);
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to load form options."
      );
    }
  }

  useEffect(() => {
    fetchSalesOrders();
    fetchFormOptions();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleCreateSalesOrder(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setSuccessMessage("");

      const salesOrderData = {
        customer_id: Number(formData.customer_id),
        items: [
          {
            product_id: Number(formData.product_id),
            quantity: Number(formData.quantity),
          },
        ],
      };

      await apiClient.post("/sales-orders", salesOrderData);

      setFormData(initialFormData);
      setSuccessMessage("Sales order created successfully.");

      await fetchSalesOrders();
      await fetchFormOptions();
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to create sales order."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <h1>Sales Orders</h1>

      <section>
        <h2>Create Sales Order</h2>

        <form onSubmit={handleCreateSalesOrder}>
          <div>
            <label htmlFor="customer_id">Customer</label>
            <br />
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="product_id">Product</label>
            <br />
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
                  {product.name} — {product.sku} — Stock:{" "}
                  {product.stock_quantity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity">Quantity</label>
            <br />
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          {createError && <p>{createError}</p>}
          {successMessage && <p>{successMessage}</p>}

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Sales Order"}
          </button>
        </form>
      </section>

      <hr />

      <h2>Sales Order List</h2>

      {loading ? (
        <p>Loading sales orders...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <button type="button" onClick={fetchSalesOrders}>
            Try again
          </button>
        </div>
      ) : salesOrders.length === 0 ? (
        <p>No sales orders found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Created By</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>GST</th>
              <th>Total</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {salesOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer_name}</td>
                <td>{order.created_by_name || "-"}</td>
                <td>{order.status}</td>
                <td>${Number(order.subtotal || 0).toFixed(2)}</td>
                <td>${Number(order.gst_amount || 0).toFixed(2)}</td>
                <td>${Number(order.total_amount || 0).toFixed(2)}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default SalesOrdersPage;