import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normaliseSupplierInput(body) {
  return {
    name: body.name?.trim(),
    email: body.email ? body.email.toLowerCase().trim() : null,
    phone: body.phone || null,
    address: body.address || null,
    contactPerson: body.contact_person || null,
    status: body.status || "active",
  };
}

export async function getSuppliers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         phone,
         address,
         contact_person,
         status,
         created_at,
         updated_at
       FROM suppliers
       ORDER BY id ASC`
    );

    res.status(200).json({
      status: "success",
      data: {
        suppliers: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         phone,
         address,
         contact_person,
         status,
         created_at,
         updated_at
       FROM suppliers
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        supplier: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(req, res, next) {
  try {
    const { name, email, phone, address, contactPerson, status } =
      normaliseSupplierInput(req.body);

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Supplier name is required",
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Supplier status must be active or inactive",
      });
    }

    if (email) {
      const existingSupplier = await pool.query(
        "SELECT id FROM suppliers WHERE email = $1",
        [email]
      );

      if (existingSupplier.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Supplier email already exists",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO suppliers (
         name,
         email,
         phone,
         address,
         contact_person,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         name,
         email,
         phone,
         address,
         contact_person,
         status,
         created_at,
         updated_at`,
      [name, email, phone, address, contactPerson, status]
    );

    const supplier = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "CREATE_SUPPLIER",
      module: "suppliers",
      entityType: "supplier",
      entityId: supplier.id,
      result: "success",
    });

    res.status(201).json({
      status: "success",
      message: "Supplier created successfully",
      data: {
        supplier,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, address, contactPerson, status } =
      normaliseSupplierInput(req.body);

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Supplier name is required",
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Supplier status must be active or inactive",
      });
    }

    if (email) {
      const existingSupplier = await pool.query(
        "SELECT id FROM suppliers WHERE email = $1 AND id <> $2",
        [email, id]
      );

      if (existingSupplier.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Supplier email already exists",
        });
      }
    }

    const result = await pool.query(
      `UPDATE suppliers
       SET name = $1,
           email = $2,
           phone = $3,
           address = $4,
           contact_person = $5,
           status = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING
         id,
         name,
         email,
         phone,
         address,
         contact_person,
         status,
         created_at,
         updated_at`,
      [name, email, phone, address, contactPerson, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    const supplier = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "UPDATE_SUPPLIER",
      module: "suppliers",
      entityType: "supplier",
      entityId: supplier.id,
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Supplier updated successfully",
      data: {
        supplier,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM suppliers
       WHERE id = $1
       RETURNING id, name, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: "DELETE_SUPPLIER",
      module: "suppliers",
      entityType: "supplier",
      entityId: Number(id),
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Supplier deleted successfully",
      data: {
        supplier: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}