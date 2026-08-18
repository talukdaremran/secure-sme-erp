import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function getCustomers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, address, created_at, updated_at
       FROM customers
       ORDER BY id ASC`
    );

    res.status(200).json({
      status: "success",
      data: {
        customers: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, phone, address, created_at, updated_at
       FROM customers
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        customer: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Customer name is required",
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, address, created_at, updated_at`,
      [
        name.trim(),
        email ? email.toLowerCase().trim() : null,
        phone || null,
        address || null,
      ]
    );

    const customer = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "CREATE_CUSTOMER",
      module: "customers",
      entityType: "customer",
      entityId: customer.id,
      result: "success",
    });

    res.status(201).json({
      status: "success",
      message: "Customer created successfully",
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Customer name is required",
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    const result = await pool.query(
      `UPDATE customers
       SET name = $1,
           email = $2,
           phone = $3,
           address = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, phone, address, created_at, updated_at`,
      [
        name.trim(),
        email ? email.toLowerCase().trim() : null,
        phone || null,
        address || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    const customer = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "UPDATE_CUSTOMER",
      module: "customers",
      entityType: "customer",
      entityId: customer.id,
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Customer updated successfully",
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;

    const salesOrderCheck = await pool.query(
      "SELECT id FROM sales_orders WHERE customer_id = $1 LIMIT 1",
      [id]
    );

    if (salesOrderCheck.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Customer cannot be deleted because sales orders exist",
      });
    }

    const result = await pool.query(
      `DELETE FROM customers
       WHERE id = $1
       RETURNING id, name, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: "DELETE_CUSTOMER",
      module: "customers",
      entityType: "customer",
      entityId: Number(id),
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Customer deleted successfully",
      data: {
        customer: result.rows[0],
      },
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This customer is linked to other records and cannot be deleted.",
      });
    }
    
    next(error);
  }
}