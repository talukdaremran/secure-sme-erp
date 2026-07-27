import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

export async function getInventoryMovements(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         inventory_movements.id,
         inventory_movements.product_id,
         products.name AS product_name,
         products.sku,
         inventory_movements.movement_type,
         inventory_movements.quantity_change,
         inventory_movements.reason,
         inventory_movements.related_sales_order_id,
         inventory_movements.created_by,
         users.name AS created_by_name,
         inventory_movements.created_at
       FROM inventory_movements
       JOIN products ON inventory_movements.product_id = products.id
       LEFT JOIN users ON inventory_movements.created_by = users.id
       ORDER BY inventory_movements.created_at DESC`
    );

    res.status(200).json({
      status: "success",
      data: {
        inventoryMovements: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createInventoryAdjustment(req, res, next) {
  const client = await pool.connect();

  try {
    const { product_id, quantity_change, reason } = req.body;

    if (!product_id || quantity_change === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Product ID and quantity change are required",
      });
    }

    const quantityChange = Number(quantity_change);

    if (!Number.isInteger(quantityChange) || quantityChange === 0) {
      return res.status(400).json({
        status: "error",
        message: "Quantity change must be a non-zero whole number",
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `SELECT id, name, stock_quantity
       FROM products
       WHERE id = $1`,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const product = productResult.rows[0];
    const newStockQuantity = Number(product.stock_quantity) + quantityChange;

    if (newStockQuantity < 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Stock quantity cannot become negative",
      });
    }

    const updatedProductResult = await client.query(
      `UPDATE products
       SET stock_quantity = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, sku, category, price, stock_quantity, low_stock_level, created_at, updated_at`,
      [newStockQuantity, product.id]
    );

    const movementResult = await client.query(
      `INSERT INTO inventory_movements
        (product_id, movement_type, quantity_change, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, movement_type, quantity_change, reason, created_by, created_at`,
      [
        product.id,
        "adjustment",
        quantityChange,
        reason || "Manual inventory adjustment",
        req.user.id,
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      action: "CREATE_INVENTORY_ADJUSTMENT",
      module: "inventory",
      entityType: "product",
      entityId: product.id,
      result: "success",
    }, client);

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Inventory adjustment created successfully",
      data: {
        product: updatedProductResult.rows[0],
        inventoryMovement: movementResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}