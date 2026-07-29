import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/products");
      setProducts(response.data.data.products);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Products</h1>
        <p>Loading products...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Products</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchProducts}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Products</h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Low Stock Level</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category || "-"}</td>
                <td>${Number(product.price).toFixed(2)}</td>
                <td>{product.stock_quantity}</td>
                <td>{product.low_stock_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ProductsPage;