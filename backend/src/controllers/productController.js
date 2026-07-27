import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

export async function getProducts(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, sku, category, price, stock_quantity, low_stock_level, created_at, updated_at
       FROM products
       ORDER BY id ASC`
    );

    res.status(200).json({
      status: "success",
      data: {
        products: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, sku, category, price, stock_quantity, low_stock_level, created_at, updated_at
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        product: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { name, sku, category, price, stock_quantity, low_stock_level } =
      req.body;

    if (!name || !sku || price === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Name, SKU, and price are required",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        status: "error",
        message: "Price must be 0 or greater",
      });
    }

    if (stock_quantity !== undefined && Number(stock_quantity) < 0) {
      return res.status(400).json({
        status: "error",
        message: "Stock quantity cannot be negative",
      });
    }

    const existingSku = await pool.query(
      "SELECT id FROM products WHERE sku = $1",
      [sku.trim()]
    );

    if (existingSku.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "SKU already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, sku, category, price, stock_quantity, low_stock_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, sku, category, price, stock_quantity, low_stock_level, created_at, updated_at`,
      [
        name.trim(),
        sku.trim(),
        category || null,
        price,
        stock_quantity ?? 0,
        low_stock_level ?? 0,
      ]
    );

    const product = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "CREATE_PRODUCT",
      module: "products",
      entityType: "product",
      entityId: product.id,
      result: "success",
    });

    res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, sku, category, price, stock_quantity, low_stock_level } =
      req.body;

    if (!name || !sku || price === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Name, SKU, and price are required",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        status: "error",
        message: "Price must be 0 or greater",
      });
    }

    if (stock_quantity !== undefined && Number(stock_quantity) < 0) {
      return res.status(400).json({
        status: "error",
        message: "Stock quantity cannot be negative",
      });
    }

    const duplicateSku = await pool.query(
      "SELECT id FROM products WHERE sku = $1 AND id <> $2",
      [sku.trim(), id]
    );

    if (duplicateSku.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "SKU already exists",
      });
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           sku = $2,
           category = $3,
           price = $4,
           stock_quantity = $5,
           low_stock_level = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, sku, category, price, stock_quantity, low_stock_level, created_at, updated_at`,
      [
        name.trim(),
        sku.trim(),
        category || null,
        price,
        stock_quantity ?? 0,
        low_stock_level ?? 0,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const product = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "UPDATE_PRODUCT",
      module: "products",
      entityType: "product",
      entityId: product.id,
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING id, name, sku`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: "DELETE_PRODUCT",
      module: "products",
      entityType: "product",
      entityId: Number(id),
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
      data: {
        product: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}