import { useEffect, useState } from "react";
import {
  FiEdit2,
  FiFilter,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/suppliers.css";

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

  function formatShortDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString();
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
      return "suppliers-status-pill status-active";
    }

    return "suppliers-status-pill status-inactive";
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

  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter((supplier) => {
    return supplier.status === "active";
  });

  const inactiveSuppliers = suppliers.filter((supplier) => {
    return supplier.status === "inactive";
  });

  const suppliersWithContactPerson = suppliers.filter((supplier) => {
    return Boolean(supplier.contact_person);
  });

  const suppliersWithEmail = suppliers.filter((supplier) => {
    return Boolean(supplier.email);
  });

  const suppliersWithPhone = suppliers.filter((supplier) => {
    return Boolean(supplier.phone);
  });

  const latestSupplier = [...suppliers].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  return (
    <section className="suppliers-page">
      <header className="suppliers-command-bar">
        <div>
          <span className="suppliers-eyebrow">Vendor directory</span>
          <h1>Suppliers</h1>
          <p>
            Manage supplier records, contact details, purchasing relationships,
            and supplier status for procurement workflows.
          </p>
        </div>

        <div className="suppliers-command-actions">
          <button
            type="button"
            className="suppliers-secondary-command"
            onClick={fetchSuppliers}
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="suppliers-primary-command"
            onClick={handleOpenCreateForm}
          >
            <FiPlus />
            New supplier
          </button>
        </div>
      </header>

      {(successMessage || deleteError || error) && (
        <div className="suppliers-message-stack">
          {deleteError && <p className="message error-message">{deleteError}</p>}
          {error && <p className="message error-message">{error}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="suppliers-kpi-strip" aria-label="Supplier metrics">
        <article className="suppliers-kpi-card">
          <div className="suppliers-kpi-icon">
            <FiTruck />
          </div>

          <div>
            <span>Total suppliers</span>
            <strong>{totalSuppliers}</strong>
            <p>Vendor records</p>
          </div>
        </article>

        <article className="suppliers-kpi-card success">
          <div className="suppliers-kpi-icon">
            <FiTruck />
          </div>

          <div>
            <span>Active suppliers</span>
            <strong>{activeSuppliers.length}</strong>
            <p>Available for purchasing</p>
          </div>
        </article>

        <article className="suppliers-kpi-card danger">
          <div className="suppliers-kpi-icon">
            <FiTruck />
          </div>

          <div>
            <span>Inactive suppliers</span>
            <strong>{inactiveSuppliers.length}</strong>
            <p>Not currently active</p>
          </div>
        </article>

        <article className="suppliers-kpi-card">
          <div className="suppliers-kpi-icon">
            <FiUser />
          </div>

          <div>
            <span>Contact people</span>
            <strong>{suppliersWithContactPerson.length}</strong>
            <p>Named contacts</p>
          </div>
        </article>

        <article className="suppliers-kpi-card">
          <div className="suppliers-kpi-icon">
            <FiMail />
          </div>

          <div>
            <span>Email records</span>
            <strong>{suppliersWithEmail.length}</strong>
            <p>Suppliers with email</p>
          </div>
        </article>

        <article className="suppliers-kpi-card">
          <div className="suppliers-kpi-icon">
            <FiPhone />
          </div>

          <div>
            <span>Phone records</span>
            <strong>{suppliersWithPhone.length}</strong>
            <p>Suppliers with phone</p>
          </div>
        </article>
      </section>

      <section className="suppliers-workspace">
        <div className="suppliers-workspace-header">
          <div>
            <span>Supplier directory</span>
            <h2>Supplier records</h2>
            <p>
              {loading
                ? "Loading suppliers..."
                : `Showing ${displayedSuppliers.length} of ${suppliers.length} suppliers.`}
              {latestSupplier
                ? ` Latest supplier: ${formatShortDate(latestSupplier.created_at)}.`
                : ""}
            </p>
          </div>
        </div>

        <div className="suppliers-toolbar">
          <div className="suppliers-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, phone, contact person, or address"
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
            <option value="all">All statuses</option>
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {hasActiveSupplierFilters && (
            <button
              type="button"
              onClick={resetSupplierFilters}
              className="suppliers-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="suppliers-table-area">
          {loading ? (
            <div className="suppliers-empty-state">
              <FiTruck />
              <h3>Loading suppliers</h3>
              <p>Please wait while supplier records are loaded.</p>
            </div>
          ) : error ? (
            <div className="suppliers-empty-state">
              <FiTruck />
              <h3>Could not load suppliers</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchSuppliers}
                className="suppliers-primary-command"
              >
                Try again
              </button>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="suppliers-empty-state">
              <FiTruck />
              <h3>No suppliers found</h3>
              <p>Create your first supplier using the command bar above.</p>

              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="suppliers-primary-command"
              >
                <FiPlus />
                New supplier
              </button>
            </div>
          ) : displayedSuppliers.length === 0 ? (
            <div className="suppliers-empty-state">
              <FiSearch />
              <h3>No matching suppliers</h3>
              <p>Try changing your search, status filter, or sort option.</p>

              <button
                type="button"
                onClick={resetSupplierFilters}
                className="suppliers-secondary-command"
              >
                Reset search
              </button>
            </div>
          ) : (
            <div className="suppliers-table-wrapper">
              <table className="suppliers-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Contact person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Created at</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>
                        <div className="supplier-cell">
                          <span className="supplier-avatar">
                            {getInitials(supplier.name)}
                          </span>

                          <strong>{supplier.name}</strong>
                        </div>
                      </td>

                      <td>{supplier.contact_person || "-"}</td>
                      <td>{supplier.email || "-"}</td>
                      <td>{supplier.phone || "-"}</td>
                      <td>{supplier.address || "-"}</td>

                      <td>
                        <span className={getStatusBadgeClass(supplier.status)}>
                          {formatLabel(supplier.status)}
                        </span>
                      </td>

                      <td>{formatDate(supplier.created_at)}</td>

                      <td>
                        <div className="suppliers-table-actions">
                          <button
                            type="button"
                            onClick={() => handleEditSupplier(supplier)}
                            className="suppliers-icon-action"
                          >
                            <FiEdit2 />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(supplier)}
                            disabled={deletingSupplierId === supplier.id}
                            className="suppliers-icon-action danger"
                          >
                            <FiTrash2 />
                            <span>
                              {deletingSupplierId === supplier.id
                                ? "Deleting"
                                : "Delete"}
                            </span>
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
      </section>

      {isSupplierFormOpen && (
        <div className="modal-backdrop">
          <section className="modal-card supplier-form-modal">
            <div className="suppliers-modal-header">
              <div>
                <span>Supplier record</span>
                <h2>{editingSupplierId ? "Edit supplier" : "Create supplier"}</h2>
                <p>
                  {editingSupplierId
                    ? "Update an existing supplier record."
                    : "Add a new supplier to the ERP vendor directory."}
                </p>
              </div>

              <button
                type="button"
                className="suppliers-icon-button"
                onClick={handleCloseSupplierForm}
                aria-label="Close supplier form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="suppliers-form-grid">
              <div className="form-field">
                <label htmlFor="name">Supplier name</label>
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
                <label htmlFor="contact_person">Contact person</label>
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

              <div className="form-field suppliers-form-full">
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
                <p className="message error-message suppliers-form-full">
                  {formError}
                </p>
              )}

              <div className="suppliers-form-actions suppliers-form-full">
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingSupplierId
                      ? "Updating..."
                      : "Creating..."
                    : editingSupplierId
                    ? "Update supplier"
                    : "Create supplier"}
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
