import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

const GST_RATE = 0.1;

export async function getSalesOrders(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT 
        sales_orders.id,
        sales_orders.customer_id,
        customers.name AS customer_name,
        sales_orders.created_by,
        users.name AS created_by_name,
        sales_orders.delivered_by,
        delivered_by_user.name AS delivered_by_name,
        sales_orders.status,
        sales_orders.subtotal,
        sales_orders.gst_amount,
        sales_orders.total_amount,
        sales_orders.delivered_at,
        sales_orders.created_at,
        sales_orders.updated_at
      FROM sales_orders
      JOIN customers ON sales_orders.customer_id = customers.id
      LEFT JOIN users ON sales_orders.created_by = users.id
      LEFT JOIN users AS delivered_by_user
        ON sales_orders.delivered_by = delivered_by_user.id
      ORDER BY sales_orders.id ASC`
    );

    res.status(200).json({
      status: "success",
      data: {
        salesOrders: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT 
         sales_orders.id,
         sales_orders.customer_id,
         customers.name AS customer_name,
         sales_orders.created_by,
         users.name AS created_by_name,
         sales_orders.delivered_by,
         delivered_by_user.name AS delivered_by_name,
         sales_orders.status,
         sales_orders.subtotal,
         sales_orders.gst_amount,
         sales_orders.total_amount,
         sales_orders.delivered_at,
         sales_orders.created_at,
         sales_orders.updated_at
       FROM sales_orders
       JOIN customers ON sales_orders.customer_id = customers.id
       LEFT JOIN users ON sales_orders.created_by = users.id
       LEFT JOIN users AS delivered_by_user
        ON sales_orders.delivered_by = delivered_by_user.id
       WHERE sales_orders.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Sales order not found",
      });
    }

    const itemsResult = await pool.query(
      `SELECT 
         sales_order_items.id,
         sales_order_items.product_id,
         products.name AS product_name,
         products.sku,
         sales_order_items.quantity,
         sales_order_items.unit_price,
         sales_order_items.line_total
       FROM sales_order_items
       JOIN products ON sales_order_items.product_id = products.id
       WHERE sales_order_items.sales_order_id = $1
       ORDER BY sales_order_items.id ASC`,
      [id]
    );

    res.status(200).json({
      status: "success",
      data: {
        salesOrder: {
          ...orderResult.rows[0],
          items: itemsResult.rows,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createSalesOrder(req, res, next) {
  const client = await pool.connect();

  try {
    const { customer_id, items } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        status: "error",
        message: "Customer ID is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Sales order must contain at least one item",
      });
    }

    await client.query("BEGIN");

    const customerResult = await client.query(
      "SELECT id FROM customers WHERE id = $1",
      [customer_id]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || Number(quantity) <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: "Each item must include a valid product ID and quantity",
        });
      }

      const productResult = await client.query(
        `SELECT id, name, sku, price, stock_quantity
         FROM products
         WHERE id = $1`,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          status: "error",
          message: `Product not found: ${product_id}`,
        });
      }

      const product = productResult.rows[0];

      if (Number(product.stock_quantity) < Number(quantity)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * Number(quantity);

      subtotal += lineTotal;

      orderItems.push({
        product_id: product.id,
        quantity: Number(quantity),
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    const gstAmount = Number((subtotal * GST_RATE).toFixed(2));
    const totalAmount = Number((subtotal + gstAmount).toFixed(2));

    const salesOrderResult = await client.query(
      `INSERT INTO sales_orders 
        (customer_id, created_by, status, subtotal, gst_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_id, created_by, status, subtotal, gst_amount, total_amount, created_at, updated_at`,
      [customer_id, req.user.id, "confirmed", subtotal, gstAmount, totalAmount]
    );

    const salesOrder = salesOrderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO sales_order_items
          (sales_order_id, product_id, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          salesOrder.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.line_total,
        ]
      );

      const stockUpdateResult = await client.query(
        `UPDATE products
        SET stock_quantity = stock_quantity - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND stock_quantity >= $1
        RETURNING id, stock_quantity`,
        [item.quantity, item.product_id]
      );

      if (stockUpdateResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: "Insufficient stock while finalising sales order",
        });
      }

      await client.query(
        `INSERT INTO inventory_movements
          (product_id, movement_type, quantity_change, reason, related_sales_order_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          item.product_id,
          "sale",
          -item.quantity,
          "Stock deducted after sales order creation",
          salesOrder.id,
          req.user.id,
        ]
      );
    }

    await createAuditLog(
      {
        userId: req.user.id,
        action: "CREATE_SALES_ORDER",
        module: "sales_orders",
        entityType: "sales_order",
        entityId: salesOrder.id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Sales order created successfully",
      data: {
        salesOrder,
        items: orderItems,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function deliverSalesOrder(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT
         id,
         customer_id,
         created_by,
         status,
         delivered_at,
         delivered_by
       FROM sales_orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Sales order not found",
      });
    }

    const salesOrder = orderResult.rows[0];

    if (salesOrder.status !== "placed") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message:
          "Only placed customer portal orders can be marked as delivered from this workflow",
      });
    }

    if (salesOrder.delivered_at) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Sales order has already been delivered",
      });
    }

    const itemsResult = await client.query(
      `SELECT
         sales_order_items.product_id,
         sales_order_items.quantity,
         products.name AS product_name
       FROM sales_order_items
       JOIN products ON sales_order_items.product_id = products.id
       WHERE sales_order_items.sales_order_id = $1
       ORDER BY sales_order_items.id ASC`,
      [id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Sales order has no items to deliver",
      });
    }

    for (const item of itemsResult.rows) {
      const stockUpdateResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND stock_quantity >= $1
         RETURNING id, stock_quantity`,
        [item.quantity, item.product_id]
      );

      if (stockUpdateResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: `Insufficient stock to deliver product: ${item.product_name}`,
        });
      }

      await client.query(
        `INSERT INTO inventory_movements
           (product_id, movement_type, quantity_change, reason, related_sales_order_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          item.product_id,
          "sale",
          -Number(item.quantity),
          "Stock deducted after customer order delivery",
          id,
          req.user.id,
        ]
      );
    }

    const updatedOrderResult = await client.query(
      `UPDATE sales_orders
       SET status = 'delivered',
           delivered_by = $1,
           delivered_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING
         id,
         customer_id,
         created_by,
         delivered_by,
         status,
         subtotal,
         gst_amount,
         total_amount,
         delivered_at,
         created_at,
         updated_at`,
      [req.user.id, id]
    );

    await createAuditLog(
      {
        userId: req.user.id,
        action: "DELIVER_SALES_ORDER",
        module: "sales_orders",
        entityType: "sales_order",
        entityId: Number(id),
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Sales order marked as delivered and stock updated",
      data: {
        salesOrder: updatedOrderResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}