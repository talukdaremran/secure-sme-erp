import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function InventoryPage() {
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchInventoryMovements();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Inventory</h1>
        <p>Loading inventory movements...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Inventory</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchInventoryMovements}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Inventory Movements</h1>

      {inventoryMovements.length === 0 ? (
        <p>No inventory movements found.</p>
      ) : (
        <table border="1" cellPadding="8">
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