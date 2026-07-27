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
         sales_orders.status,
         sales_orders.subtotal,
         sales_orders.gst_amount,
         sales_orders.total_amount,
         sales_orders.created_at,
         sales_orders.updated_at
       FROM sales_orders
       JOIN customers ON sales_orders.customer_id = customers.id
       LEFT JOIN users ON sales_orders.created_by = users.id
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
         sales_orders.status,
         sales_orders.subtotal,
         sales_orders.gst_amount,
         sales_orders.total_amount,
         sales_orders.created_at,
         sales_orders.updated_at
       FROM sales_orders
       JOIN customers ON sales_orders.customer_id = customers.id
       LEFT JOIN users ON sales_orders.created_by = users.id
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