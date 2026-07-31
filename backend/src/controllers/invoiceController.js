import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

function generateInvoiceNumber(salesOrderId) {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(salesOrderId).padStart(5, "0")}`;
}

export async function getInvoices(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         invoices.id,
         invoices.sales_order_id,
         invoices.invoice_number,
         invoices.subtotal,
         invoices.gst_amount,
         invoices.total_amount,
         invoices.status,
         invoices.issued_at,
         invoices.created_at,
         invoices.updated_at,
         customers.name AS customer_name
       FROM invoices
       JOIN sales_orders ON invoices.sales_order_id = sales_orders.id
       JOIN customers ON sales_orders.customer_id = customers.id
       ORDER BY invoices.id ASC`
    );

    res.status(200).json({
      status: "success",
      data: {
        invoices: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;

    const invoiceResult = await pool.query(
      `SELECT
         invoices.id,
         invoices.sales_order_id,
         invoices.invoice_number,
         invoices.subtotal,
         invoices.gst_amount,
         invoices.total_amount,
         invoices.status,
         invoices.issued_at,
         invoices.created_at,
         invoices.updated_at,
         customers.id AS customer_id,
         customers.name AS customer_name,
         customers.email AS customer_email
       FROM invoices
       JOIN sales_orders ON invoices.sales_order_id = sales_orders.id
       JOIN customers ON sales_orders.customer_id = customers.id
       WHERE invoices.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
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
      [invoiceResult.rows[0].sales_order_id]
    );

    res.status(200).json({
      status: "success",
      data: {
        invoice: {
          ...invoiceResult.rows[0],
          items: itemsResult.rows,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req, res, next) {
  const client = await pool.connect();

  try {
    const { sales_order_id } = req.body;

    if (!sales_order_id) {
      return res.status(400).json({
        status: "error",
        message: "Sales order ID is required",
      });
    }

    await client.query("BEGIN");

    const salesOrderResult = await client.query(
      `SELECT id, subtotal, gst_amount, total_amount, status
       FROM sales_orders
       WHERE id = $1`,
      [sales_order_id]
    );

    if (salesOrderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Sales order not found",
      });
    }

    const existingInvoice = await client.query(
      "SELECT id FROM invoices WHERE sales_order_id = $1",
      [sales_order_id]
    );

    if (existingInvoice.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Invoice already exists for this sales order",
      });
    }

    const salesOrder = salesOrderResult.rows[0];
    const invoiceNumber = generateInvoiceNumber(salesOrder.id);

    const invoiceResult = await client.query(
      `INSERT INTO invoices
        (sales_order_id, invoice_number, subtotal, gst_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sales_order_id, invoice_number, subtotal, gst_amount, total_amount, status, issued_at, created_at, updated_at`,
      [
        salesOrder.id,
        invoiceNumber,
        salesOrder.subtotal,
        salesOrder.gst_amount,
        salesOrder.total_amount,
        "pending",
      ]
    );

    const invoice = invoiceResult.rows[0];

    await createAuditLog({
      userId: req.user.id,
      action: "GENERATE_INVOICE",
      module: "invoices",
      entityType: "invoice",
      entityId: invoice.id,
      result: "success",
    }, client);

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Invoice generated successfully",
      data: {
        invoice,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function updateInvoicePaymentStatus(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status, payment_method } = req.body;

    const allowedStatuses = ["pending", "paid", "failed", "cancelled", "refunded"];

    if (!status) {
      return res.status(400).json({
        status: "error",
        message: "Payment status is required",
      });
    }

    const normalisedStatus = status.toLowerCase().trim();

    if (!allowedStatuses.includes(normalisedStatus)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid payment status",
      });
    }

    await client.query("BEGIN");

    const invoiceResult = await client.query(
      `SELECT id, total_amount
       FROM invoices
       WHERE id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
      });
    }

    const invoice = invoiceResult.rows[0];

    const paymentResult = await client.query(
      `INSERT INTO payments
        (invoice_id, status, amount, payment_method, paid_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, invoice_id, status, amount, payment_method, paid_at, created_at`,
      [
        invoice.id,
        normalisedStatus,
        invoice.total_amount,
        payment_method || null,
        normalisedStatus === "paid" ? new Date() : null,
      ]
    );

    const updatedInvoiceResult = await client.query(
      `UPDATE invoices
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, sales_order_id, invoice_number, subtotal, gst_amount, total_amount, status, issued_at, created_at, updated_at`,
      [normalisedStatus, invoice.id]
    );

    await createAuditLog({
      userId: req.user.id,
      action: "UPDATE_PAYMENT_STATUS",
      module: "invoices",
      entityType: "invoice",
      entityId: invoice.id,
      result: "success",
    }, client);

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Payment status updated successfully",
      data: {
        invoice: updatedInvoiceResult.rows[0],
        payment: paymentResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}