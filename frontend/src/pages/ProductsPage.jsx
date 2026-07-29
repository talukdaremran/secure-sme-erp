import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const initialFormData = {
  name: "",
  sku: "",
  category: "",
  price: "",
  stock_quantity: "",
  low_stock_level: "",
};

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingProductId, setEditingProductId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");

    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      price: product.price || "",
      stock_quantity: product.stock_quantity || 0,
      low_stock_level: product.low_stock_level || 0,
    });
  }

  function handleCancelEdit() {
    setEditingProductId(null);
    setFormData(initialFormData);
    setFormError("");
    setSuccessMessage("");
  }

  async function handleSubmitProduct(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setSuccessMessage("");

      const productData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category || null,
        price: Number(formData.price),
        stock_quantity: Number(formData.stock_quantity || 0),
        low_stock_level: Number(formData.low_stock_level || 0),
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

  return (
    <section>
      <h1>Products</h1>

      <section>
        <h2>{editingProductId ? "Edit Product" : "Create Product"}</h2>

        <form onSubmit={handleSubmitProduct}>
          <div>
            <label htmlFor="name">Name</label>
            <br />
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="sku">SKU</label>
            <br />
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="category">Category</label>
            <br />
            <input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="price">Price</label>
            <br />
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

          <div>
            <label htmlFor="stock_quantity">Stock Quantity</label>
            <br />
            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={formData.stock_quantity}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="low_stock_level">Low Stock Level</label>
            <br />
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

          {formError && <p>{formError}</p>}
          {successMessage && <p>{successMessage}</p>}

          <button type="submit" disabled={saving}>
            {saving
              ? editingProductId
                ? "Updating..."
                : "Creating..."
              : editingProductId
              ? "Update Product"
              : "Create Product"}
          </button>

          {editingProductId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      <hr />

      <h2>Product List</h2>

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <button type="button" onClick={fetchProducts}>
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category || "-"}</td>
                <td>${Number(product.price || 0).toFixed(2)}</td>
                <td>{product.stock_quantity}</td>
                <td>{product.low_stock_level}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleEditProduct(product)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ProductsPage;