import pool from "../config/db.js";
import { convertToCSV } from "../utils/csvHelper.js";
import { createAuditLog } from "../utils/auditLogger.js";

function sendCSVResponse(res, filename, rows) {
  const csv = convertToCSV(rows);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  res.status(200).send(csv);
}

export async function exportProducts(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        sku,
        category,
        price,
        stock_quantity,
        low_stock_level,
        created_at
      FROM products
      ORDER BY id ASC
    `);

    await createAuditLog({
      userId: req.user.id,
      action: "EXPORT_PRODUCTS",
      module: "exports",
      entityType: "products",
      result: "success",
    });

    sendCSVResponse(res, "products.csv", result.rows);
  } catch (error) {
    next(error);
  }
}

export async function exportCustomers(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        address,
        created_at
      FROM customers
      ORDER BY id ASC
    `);

    await createAuditLog({
      userId: req.user.id,
      action: "EXPORT_CUSTOMERS",
      module: "exports",
      entityType: "customers",
      result: "success",
    });

    sendCSVResponse(res, "customers.csv", result.rows);
  } catch (error) {
    next(error);
  }
}

export async function exportSalesOrders(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        sales_orders.id,
        customers.name AS customer_name,
        users.name AS created_by_name,
        sales_orders.status,
        sales_orders.subtotal,
        sales_orders.gst_amount,
        sales_orders.total_amount,
        sales_orders.created_at
      FROM sales_orders
      JOIN customers ON sales_orders.customer_id = customers.id
      LEFT JOIN users ON sales_orders.created_by = users.id
      ORDER BY sales_orders.id ASC
    `);

    await createAuditLog({
      userId: req.user.id,
      action: "EXPORT_SALES_ORDERS",
      module: "exports",
      entityType: "sales_orders",
      result: "success",
    });

    sendCSVResponse(res, "sales-orders.csv", result.rows);
  } catch (error) {
    next(error);
  }
}

export async function exportInvoices(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        invoices.id,
        invoices.invoice_number,
        invoices.sales_order_id,
        customers.name AS customer_name,
        invoices.status,
        invoices.subtotal,
        invoices.gst_amount,
        invoices.total_amount,
        invoices.issued_at
      FROM invoices
      JOIN sales_orders ON invoices.sales_order_id = sales_orders.id
      JOIN customers ON sales_orders.customer_id = customers.id
      ORDER BY invoices.id ASC
    `);

    await createAuditLog({
      userId: req.user.id,
      action: "EXPORT_INVOICES",
      module: "exports",
      entityType: "invoices",
      result: "success",
    });

    sendCSVResponse(res, "invoices.csv", result.rows);
  } catch (error) {
    next(error);
  }
}

export async function exportPurchaseOrders(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        purchase_orders.id,
        suppliers.name AS supplier_name,
        users.name AS created_by_name,
        received_by_user.name AS received_by_name,
        purchase_orders.status,
        purchase_orders.subtotal,
        purchase_orders.gst_amount,
        purchase_orders.total_amount,
        purchase_orders.expected_delivery_date,
        purchase_orders.received_at,
        purchase_orders.created_at
      FROM purchase_orders
      JOIN suppliers ON purchase_orders.supplier_id = suppliers.id
      LEFT JOIN users ON purchase_orders.created_by = users.id
      LEFT JOIN users AS received_by_user
        ON purchase_orders.received_by = received_by_user.id
      ORDER BY purchase_orders.id ASC
    `);

    await createAuditLog({
      userId: req.user.id,
      action: "EXPORT_PURCHASE_ORDERS",
      module: "exports",
      entityType: "purchase_orders",
      result: "success",
    });

    sendCSVResponse(res, "purchase-orders.csv", result.rows);
  } catch (error) {
    next(error);
  }
}