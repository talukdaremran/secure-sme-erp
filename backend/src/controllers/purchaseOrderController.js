import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

const GST_RATE = 0.1;

const allowedPurchaseOrderStatuses = ["draft", "ordered", "cancelled"];

function calculateLineTotal(quantity, unitCost) {
  return Number((quantity * unitCost).toFixed(2));
}

function calculateGstAmount(subtotal) {
  return Number((subtotal * GST_RATE).toFixed(2));
}

function normaliseStatus(status) {
  return status ? status.trim().toLowerCase() : "draft";
}

export async function getPurchaseOrders(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         purchase_orders.id,
         purchase_orders.status,
         purchase_orders.subtotal,
         purchase_orders.gst_amount,
         purchase_orders.total_amount,
         purchase_orders.expected_delivery_date,
         purchase_orders.notes,
         purchase_orders.created_at,
         purchase_orders.updated_at,
         suppliers.name AS supplier_name,
         users.name AS created_by_name,
         COUNT(purchase_order_items.id) AS item_count
       FROM purchase_orders
       JOIN suppliers ON purchase_orders.supplier_id = suppliers.id
       LEFT JOIN users ON purchase_orders.created_by = users.id
       LEFT JOIN purchase_order_items
         ON purchase_orders.id = purchase_order_items.purchase_order_id
       GROUP BY
         purchase_orders.id,
         suppliers.name,
         users.name
       ORDER BY purchase_orders.id DESC`
    );

    res.status(200).json({
      status: "success",
      data: {
        purchaseOrders: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT
         purchase_orders.id,
         purchase_orders.supplier_id,
         purchase_orders.created_by,
         purchase_orders.status,
         purchase_orders.subtotal,
         purchase_orders.gst_amount,
         purchase_orders.total_amount,
         purchase_orders.expected_delivery_date,
         purchase_orders.notes,
         purchase_orders.created_at,
         purchase_orders.updated_at,
         suppliers.name AS supplier_name,
         suppliers.email AS supplier_email,
         suppliers.phone AS supplier_phone,
         suppliers.contact_person AS supplier_contact_person,
         users.name AS created_by_name
       FROM purchase_orders
       JOIN suppliers ON purchase_orders.supplier_id = suppliers.id
       LEFT JOIN users ON purchase_orders.created_by = users.id
       WHERE purchase_orders.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Purchase order not found",
      });
    }

    const itemsResult = await pool.query(
      `SELECT
         purchase_order_items.id,
         purchase_order_items.product_id,
         purchase_order_items.quantity,
         purchase_order_items.unit_cost,
         purchase_order_items.line_total,
         products.name AS product_name,
         products.sku AS product_sku
       FROM purchase_order_items
       JOIN products ON purchase_order_items.product_id = products.id
       WHERE purchase_order_items.purchase_order_id = $1
       ORDER BY purchase_order_items.id ASC`,
      [id]
    );

    res.status(200).json({
      status: "success",
      data: {
        purchaseOrder: {
          ...orderResult.rows[0],
          items: itemsResult.rows,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseOrder(req, res, next) {
  const client = await pool.connect();

  try {
    const {
      supplier_id,
      items,
      status,
      expected_delivery_date,
      notes,
    } = req.body;

    if (!supplier_id) {
      return res.status(400).json({
        status: "error",
        message: "Supplier is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one purchase order item is required",
      });
    }

    const normalisedStatus = normaliseStatus(status);

    if (!allowedPurchaseOrderStatuses.includes(normalisedStatus)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid purchase order status",
      });
    }

    await client.query("BEGIN");

    const supplierResult = await client.query(
      "SELECT id, name FROM suppliers WHERE id = $1",
      [supplier_id]
    );

    if (supplierResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    const preparedItems = [];

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unit_cost);

      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: "Each item must have a valid product and quantity",
        });
      }

      if (Number.isNaN(unitCost) || unitCost < 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: "Each item must have a valid unit cost",
        });
      }

      const productResult = await client.query(
        "SELECT id, name, sku FROM products WHERE id = $1",
        [productId]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          status: "error",
          message: `Product with id ${productId} not found`,
        });
      }

      preparedItems.push({
        product_id: productId,
        quantity,
        unit_cost: unitCost,
        line_total: calculateLineTotal(quantity, unitCost),
      });
    }

    const subtotal = preparedItems.reduce((sum, item) => {
      return sum + item.line_total;
    }, 0);

    const roundedSubtotal = Number(subtotal.toFixed(2));
    const gstAmount = calculateGstAmount(roundedSubtotal);
    const totalAmount = Number((roundedSubtotal + gstAmount).toFixed(2));

    const orderResult = await client.query(
      `INSERT INTO purchase_orders (
         supplier_id,
         created_by,
         status,
         subtotal,
         gst_amount,
         total_amount,
         expected_delivery_date,
         notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         id,
         supplier_id,
         created_by,
         status,
         subtotal,
         gst_amount,
         total_amount,
         expected_delivery_date,
         notes,
         created_at,
         updated_at`,
      [
        supplier_id,
        req.user.id,
        normalisedStatus,
        roundedSubtotal,
        gstAmount,
        totalAmount,
        expected_delivery_date || null,
        notes || null,
      ]
    );

    const purchaseOrder = orderResult.rows[0];

    for (const item of preparedItems) {
      await client.query(
        `INSERT INTO purchase_order_items (
           purchase_order_id,
           product_id,
           quantity,
           unit_cost,
           line_total
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          purchaseOrder.id,
          item.product_id,
          item.quantity,
          item.unit_cost,
          item.line_total,
        ]
      );
    }

    await createAuditLog(
      {
        userId: req.user.id,
        action: "CREATE_PURCHASE_ORDER",
        module: "purchase_orders",
        entityType: "purchase_order",
        entityId: purchaseOrder.id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Purchase order created successfully",
      data: {
        purchaseOrder,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function updatePurchaseOrderStatus(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const normalisedStatus = normaliseStatus(status);

    if (!allowedPurchaseOrderStatuses.includes(normalisedStatus)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid purchase order status",
      });
    }

    await client.query("BEGIN");

    const orderCheck = await client.query(
      "SELECT id, status FROM purchase_orders WHERE id = $1",
      [id]
    );

    if (orderCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Purchase order not found",
      });
    }

    const result = await client.query(
      `UPDATE purchase_orders
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING
         id,
         supplier_id,
         created_by,
         status,
         subtotal,
         gst_amount,
         total_amount,
         expected_delivery_date,
         notes,
         created_at,
         updated_at`,
      [normalisedStatus, id]
    );

    await createAuditLog(
      {
        userId: req.user.id,
        action: "UPDATE_PURCHASE_ORDER_STATUS",
        module: "purchase_orders",
        entityType: "purchase_order",
        entityId: Number(id),
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Purchase order status updated successfully",
      data: {
        purchaseOrder: result.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}