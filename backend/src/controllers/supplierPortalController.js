import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

function requireSupplierPortalUser(req, res) {
  if (!req.portalUser || req.portalUser.role !== "supplier") {
    res.status(403).json({
      status: "error",
      message: "Supplier portal access is required",
    });

    return false;
  }

  if (!req.portalUser.supplier_id) {
    res.status(403).json({
      status: "error",
      message: "Supplier profile is not linked to this portal account",
    });

    return false;
  }

  return true;
}

export async function getSupplierPortalPurchaseOrders(req, res, next) {
  try {
    if (!requireSupplierPortalUser(req, res)) {
      return;
    }

    const result = await pool.query(
      `SELECT
         purchase_orders.id,
         purchase_orders.status,
         purchase_orders.subtotal,
         purchase_orders.gst_amount,
         purchase_orders.total_amount,
         purchase_orders.expected_delivery_date,
         purchase_orders.notes,
         purchase_orders.supplier_delivered_at,
         purchase_orders.supplier_delivery_note,
         purchase_orders.received_at,
         purchase_orders.created_at,
         purchase_orders.updated_at,
         users.name AS created_by_name,
         COUNT(purchase_order_items.id) AS item_count
       FROM purchase_orders
       LEFT JOIN users ON purchase_orders.created_by = users.id
       LEFT JOIN purchase_order_items
         ON purchase_orders.id = purchase_order_items.purchase_order_id
       WHERE purchase_orders.supplier_id = $1
         AND purchase_orders.status IN (
           'ordered',
           'supplier_delivered',
           'received',
           'cancelled'
         )
       GROUP BY
         purchase_orders.id,
         users.name
       ORDER BY purchase_orders.id DESC`,
      [req.portalUser.supplier_id]
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

export async function getSupplierPortalPurchaseOrderById(req, res, next) {
  try {
    if (!requireSupplierPortalUser(req, res)) {
      return;
    }

    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT
         purchase_orders.id,
         purchase_orders.status,
         purchase_orders.subtotal,
         purchase_orders.gst_amount,
         purchase_orders.total_amount,
         purchase_orders.expected_delivery_date,
         purchase_orders.notes,
         purchase_orders.supplier_delivered_at,
         purchase_orders.supplier_delivery_note,
         purchase_orders.received_at,
         purchase_orders.created_at,
         purchase_orders.updated_at,
         users.name AS created_by_name
       FROM purchase_orders
       LEFT JOIN users ON purchase_orders.created_by = users.id
       WHERE purchase_orders.id = $1
         AND purchase_orders.supplier_id = $2`,
      [id, req.portalUser.supplier_id]
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

export async function markSupplierPurchaseOrderDelivered(req, res, next) {
  const client = await pool.connect();

  try {
    if (!requireSupplierPortalUser(req, res)) {
      return;
    }

    const { id } = req.params;
    const { delivery_note } = req.body;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, supplier_id, status
       FROM purchase_orders
       WHERE id = $1
         AND supplier_id = $2
       FOR UPDATE`,
      [id, req.portalUser.supplier_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Purchase order not found",
      });
    }

    const purchaseOrder = orderResult.rows[0];

    if (purchaseOrder.status === "cancelled") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Cancelled purchase orders cannot be marked as delivered",
      });
    }

    if (purchaseOrder.status === "received") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Received purchase orders cannot be marked as delivered",
      });
    }

    if (purchaseOrder.status === "supplier_delivered") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Purchase order has already been marked as delivered",
      });
    }

    if (purchaseOrder.status !== "ordered") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Only ordered purchase orders can be marked as delivered",
      });
    }

    const updatedResult = await client.query(
      `UPDATE purchase_orders
       SET status = 'supplier_delivered',
           supplier_delivered_at = CURRENT_TIMESTAMP,
           supplier_delivered_by = $1,
           supplier_delivery_note = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING
         id,
         supplier_id,
         status,
         subtotal,
         gst_amount,
         total_amount,
         expected_delivery_date,
         notes,
         supplier_delivered_at,
         supplier_delivered_by,
         supplier_delivery_note,
         received_at,
         received_by,
         created_at,
         updated_at`,
      [req.portalUser.id, delivery_note || null, id]
    );

    await createAuditLog(
      {
        userId: null,
        action: "SUPPLIER_MARK_PURCHASE_ORDER_DELIVERED",
        module: "supplier_portal",
        entityType: "purchase_order",
        entityId: Number(id),
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message:
        "Purchase order marked as delivered. Staff will confirm receiving before stock is updated.",
      data: {
        purchaseOrder: updatedResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}