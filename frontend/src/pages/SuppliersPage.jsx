import { useEffect, useState } from "react";
import {
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import ConfirmModal from "../components/ConfirmModal";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  contact_person: "",
  status: "active",
};

const statusOptions = ["active", "inactive"];

function SuppliersPage() {
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSupplierId, setDeletingSupplierId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchSuppliers() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/suppliers");
      setSuppliers(response.data?.data?.suppliers || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuppliers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleOpenCreateForm() {
    setEditingSupplierId(null);
    setFormData(initialFormData);
    setFormError("");
    setDeleteError("");
    setSuccessMessage("");
    setIsSupplierFormOpen(true);
  }

  function handleEditSupplier(supplier) {
    setEditingSupplierId(supplier.id);
    setFormError("");
    setDeleteError("");
    setSuccessMessage("");

    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      contact_person: supplier.contact_person || "",
      status: supplier.status || "active",
    });

    setIsSupplierFormOpen(true);
  }

  function handleCloseSupplierForm() {
    setEditingSupplierId(null);
    setFormData(initialFormData);
    setFormError("");
    setIsSupplierFormOpen(false);
  }

  async function handleSubmitSupplier(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      const supplierData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        contact_person: formData.contact_person || null,
        status: formData.status,
      };

      if (editingSupplierId) {
        await apiClient.put(`/suppliers/${editingSupplierId}`, supplierData);
        setSuccessMessage("Supplier updated successfully.");
      } else {
        await apiClient.post("/suppliers", supplierData);
        setSuccessMessage("Supplier created successfully.");
      }

      setFormData(initialFormData);
      setEditingSupplierId(null);
      setIsSupplierFormOpen(false);

      await fetchSuppliers();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          `Failed to ${editingSupplierId ? "update" : "create"} supplier.`
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteSupplier(supplier) {
    setSupplierToDelete(supplier);
  }

  async function confirmDeleteSupplier() {
    if (!supplierToDelete) {
      return;
    }

    try {
      setDeletingSupplierId(supplierToDelete.id);
      setFormError("");
      setDeleteError("");
      setSuccessMessage("");

      await apiClient.delete(`/suppliers/${supplierToDelete.id}`);

      if (editingSupplierId === supplierToDelete.id) {
        setEditingSupplierId(null);
        setFormData(initialFormData);
        setIsSupplierFormOpen(false);
      }

      setSuccessMessage("Supplier deleted successfully.");
      setSupplierToDelete(null);

      await fetchSuppliers();
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Failed to delete supplier."
      );
    } finally {
      setDeletingSupplierId(null);
    }
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatLabel(value) {
    if (!value) {
      return "-";
    }

    return String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function getInitials(name) {
    if (!name) {
      return "S";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  function getStatusBadgeClass(status) {
    if (status === "active") {
      return "badge badge-success";
    }

    return "badge badge-danger";
  }

  const displayedSuppliers = suppliers
    .filter((supplier) => {
      const searchableText = `${supplier.name || ""} ${supplier.email || ""} ${
        supplier.phone || ""
      } ${supplier.address || ""} ${
        supplier.contact_person || ""
      } ${supplier.status || ""}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || supplier.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortOption === "name-asc") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortOption === "name-desc") {
        return String(b.name || "").localeCompare(String(a.name || ""));
      }

      return 0;
    });

  const hasActiveSupplierFilters = searchQuery || statusFilter !== "all";

  function resetSupplierFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOption("newest");
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p>
            Manage supplier records, contact details, and purchasing
            relationships.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" onClick={handleOpenCreateForm}>
            + New Supplier
          </button>
        </div>
      </div>

      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      {isSupplierFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card customer-form-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingSupplierId ? "Edit Supplier" : "Create Supplier"}
                </h2>
                <p>
                  {editingSupplierId
                    ? "Update an existing supplier record."
                    : "Add a new supplier to the ERP system."}
                </p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseSupplierForm}
                aria-label="Close supplier form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="form-grid">
              <div className="form-field">
                <label htmlFor="name">Supplier Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contact_person">Contact Person</label>
                <input
                  id="contact_person"
                  name="contact_person"
                  type="text"
                  value={formData.contact_person}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field full-width">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              {formError && (
                <p className="message error-message full-width">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingSupplierId
                      ? "Updating..."
                      : "Creating..."
                    : editingSupplierId
                    ? "Update Supplier"
                    : "Create Supplier"}
                </button>

                <button
                  type="button"
                  onClick={handleCloseSupplierForm}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Supplier Directory</h2>
            <p>
              {loading
                ? "Loading suppliers..."
                : `Showing ${displayedSuppliers.length} of ${suppliers.length} suppliers.`}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSuppliers}
            className="secondary-button"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="table-toolbar customers-table-toolbar">
          <div className="toolbar-input-with-icon">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, phone, contact person, or address..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search suppliers"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter suppliers by status"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort suppliers"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {hasActiveSupplierFilters && (
            <button
              type="button"
              onClick={resetSupplierFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {deleteError && <p className="message error-message">{deleteError}</p>}

          {loading ? (
            <p>Loading suppliers...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchSuppliers}>
                Try Again
              </button>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="empty-state">
              <FiTruck />
              <h3>No suppliers found</h3>
              <p>Create your first supplier using the New Supplier button.</p>
            </div>
          ) : displayedSuppliers.length === 0 ? (
            <div className="empty-state">
              <FiSearch />
              <h3>No matching suppliers found</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetSupplierFilters}
                className="secondary-button"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar">
                            {getInitials(supplier.name)}
                          </span>

                          <strong>{supplier.name}</strong>
                        </div>
                      </td>

                      <td>{supplier.contact_person || "-"}</td>
                      <td>{supplier.email || "-"}</td>
                      <td>{supplier.phone || "-"}</td>
                      <td>
                        <span className={getStatusBadgeClass(supplier.status)}>
                          {formatLabel(supplier.status)}
                        </span>
                      </td>
                      <td>{formatDate(supplier.created_at)}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => handleEditSupplier(supplier)}
                            className="secondary-button"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(supplier)}
                            disabled={deletingSupplierId === supplier.id}
                            className="danger-button"
                          >
                            {deletingSupplierId === supplier.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(supplierToDelete)}
        title="Delete supplier?"
        message={
          supplierToDelete
            ? `Are you sure you want to delete "${supplierToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Supplier"
        isLoading={deletingSupplierId === supplierToDelete?.id}
        onConfirm={confirmDeleteSupplier}
        onCancel={() => setSupplierToDelete(null)}
      />
    </section>
  );
}

export default SuppliersPage;