import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

const GST_RATE = 0.1;

function requireCustomerPortalUser(req, res) {
  if (!req.portalUser || req.portalUser.role !== "customer") {
    res.status(403).json({
      status: "error",
      message: "Customer portal access is required",
    });

    return false;
  }

  if (!req.portalUser.customer_id) {
    res.status(403).json({
      status: "error",
      message: "Customer profile is not linked to this portal account",
    });

    return false;
  }

  return true;
}

export async function getCustomerPortalProducts(req, res, next) {
  try {
    if (!requireCustomerPortalUser(req, res)) {
      return;
    }

    const result = await pool.query(
      `SELECT
         id,
         name,
         sku,
         category,
         price,
         stock_quantity,
         low_stock_level
       FROM products
       WHERE stock_quantity > 0
       ORDER BY name ASC`
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

export async function getCustomerPortalOrders(req, res, next) {
  try {
    if (!requireCustomerPortalUser(req, res)) {
      return;
    }

    const ordersResult = await pool.query(
      `SELECT
         sales_orders.id,
         sales_orders.customer_id,
         sales_orders.status,
         sales_orders.subtotal,
         sales_orders.gst_amount,
         sales_orders.total_amount,
         sales_orders.created_at,
         sales_orders.updated_at
       FROM sales_orders
       WHERE sales_orders.customer_id = $1
       ORDER BY sales_orders.created_at DESC`,
      [req.portalUser.customer_id]
    );

    const orders = ordersResult.rows;

    if (orders.length === 0) {
      return res.status(200).json({
        status: "success",
        data: {
          orders: [],
        },
      });
    }

    const orderIds = orders.map((order) => order.id);

    const itemsResult = await pool.query(
      `SELECT
         sales_order_items.id,
         sales_order_items.sales_order_id,
         sales_order_items.product_id,
         products.name AS product_name,
         products.sku,
         sales_order_items.quantity,
         sales_order_items.unit_price,
         sales_order_items.line_total
       FROM sales_order_items
       JOIN products ON sales_order_items.product_id = products.id
       WHERE sales_order_items.sales_order_id = ANY($1::int[])
       ORDER BY sales_order_items.id ASC`,
      [orderIds]
    );

    const itemsByOrderId = itemsResult.rows.reduce((groupedItems, item) => {
      if (!groupedItems[item.sales_order_id]) {
        groupedItems[item.sales_order_id] = [];
      }

      groupedItems[item.sales_order_id].push(item);
      return groupedItems;
    }, {});

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: itemsByOrderId[order.id] || [],
    }));

    res.status(200).json({
      status: "success",
      data: {
        orders: ordersWithItems,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomerPortalOrder(req, res, next) {
  const client = await pool.connect();

  try {
    if (!requireCustomerPortalUser(req, res)) {
      return;
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Cart must contain at least one item",
      });
    }

    const mergedItemsMap = new Map();

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Each cart item must include a valid product ID",
        });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Each cart item must include a valid quantity",
        });
      }

      const existingQuantity = mergedItemsMap.get(productId) || 0;
      mergedItemsMap.set(productId, existingQuantity + quantity);
    }

    await client.query("BEGIN");

    const orderItems = [];
    let subtotal = 0;

    for (const [productId, quantity] of mergedItemsMap.entries()) {
      const productResult = await client.query(
        `SELECT
           id,
           name,
           sku,
           price,
           stock_quantity
         FROM products
         WHERE id = $1`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          status: "error",
          message: `Product not found: ${productId}`,
        });
      }

      const product = productResult.rows[0];

      if (Number(product.stock_quantity) < quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          status: "error",
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * quantity;

      subtotal += lineTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    const gstAmount = Number((subtotal * GST_RATE).toFixed(2));
    const totalAmount = Number((subtotal + gstAmount).toFixed(2));

    const salesOrderResult = await client.query(
      `INSERT INTO sales_orders
         (customer_id, created_by, status, subtotal, gst_amount, total_amount)
       VALUES ($1, NULL, $2, $3, $4, $5)
       RETURNING
         id,
         customer_id,
         created_by,
         status,
         subtotal,
         gst_amount,
         total_amount,
         created_at,
         updated_at`,
      [
        req.portalUser.customer_id,
        "placed",
        subtotal,
        gstAmount,
        totalAmount,
      ]
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
        userId: null,
        action: "CREATE_CUSTOMER_PORTAL_ORDER",
        module: "customer_portal",
        entityType: "sales_order",
        entityId: salesOrder.id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message:
        "Order placed successfully. Stock will be updated after staff delivery confirmation.",
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