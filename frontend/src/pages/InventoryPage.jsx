import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
  product_id: "",
  quantity_change: "",
  reason: "",
};

function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchInventoryMovements() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/inventory-movements");
      setInventoryMovements(response.data.data.inventoryMovements);
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
      const response = await apiClient.get("/products");
      setProducts(response.data.data.products);
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to load product options."
      );
    }
  }

  useEffect(() => {
    fetchInventoryMovements();

    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleCreateAdjustment(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setSuccessMessage("");

      const adjustmentData = {
        product_id: Number(formData.product_id),
        quantity_change: Number(formData.quantity_change),
        reason: formData.reason || null,
      };

      await apiClient.post("/inventory-movements", adjustmentData);

      setFormData(initialFormData);
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

  return (
    <section>
      <h1>Inventory</h1>

      {!isAdmin && (
        <p>
          You can view inventory movement history. Manual inventory adjustments
          are available to Admin users only.
        </p>
      )}

      {isAdmin && (
        <section>
          <h2>Create Inventory Adjustment</h2>

          <form onSubmit={handleCreateAdjustment}>
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
                    {product.name} — {product.sku} — Current stock:{" "}
                    {product.stock_quantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quantity_change">Quantity Change</label>
              <br />
              <input
                id="quantity_change"
                name="quantity_change"
                type="number"
                step="1"
                value={formData.quantity_change}
                onChange={handleChange}
                required
              />
              <p>
                Use a positive number to increase stock, or a negative number to
                decrease stock.
              </p>
            </div>

            <div>
              <label htmlFor="reason">Reason</label>
              <br />
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                placeholder="Example: Stock count correction"
              />
            </div>

            {createError && <p>{createError}</p>}
            {successMessage && <p>{successMessage}</p>}

            <button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Adjustment"}
            </button>
          </form>
        </section>
      )}

      <hr />

      <h2>Inventory Movement List</h2>

      {loading ? (
        <p>Loading inventory movements...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <button type="button" onClick={fetchInventoryMovements}>
            Try again
          </button>
        </div>
      ) : inventoryMovements.length === 0 ? (
        <p>No inventory movements found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
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
            {inventoryMovements.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.id}</td>
                <td>{movement.product_name}</td>
                <td>{movement.sku}</td>
                <td>{movement.movement_type}</td>
                <td>{movement.quantity_change}</td>
                <td>{movement.reason || "-"}</td>
                <td>{movement.related_sales_order_id || "-"}</td>
                <td>{movement.created_by_name || "-"}</td>
                <td>{new Date(movement.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default InventoryPage;