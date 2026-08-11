import pool from "../config/db.js";

export async function getDashboardSummary(req, res, next) {
  try {
    const [
      productsResult,
      customersResult,
      salesOrdersResult,
      invoicesResult,
      paidRevenueResult,
      pendingInvoicesResult,
      lowStockResult,
      recentActivityResult,

      suppliersResult,
      openPurchaseOrdersResult,
      pendingReceiptPurchaseOrdersResult,
      receivedPurchaseOrdersResult,
      receivedProcurementSpendResult,
      recentPurchaseOrdersResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total_products FROM products"),

      pool.query("SELECT COUNT(*)::int AS total_customers FROM customers"),

      pool.query("SELECT COUNT(*)::int AS total_sales_orders FROM sales_orders"),

      pool.query("SELECT COUNT(*)::int AS total_invoices FROM invoices"),

      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0)::numeric(10,2) AS total_paid_revenue
         FROM invoices
         WHERE status = 'paid'`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS pending_invoices
         FROM invoices
         WHERE status = 'pending'`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS low_stock_products
         FROM products
         WHERE stock_quantity <= low_stock_level`
      ),

      pool.query(
        `SELECT
           audit_logs.id,
           audit_logs.action,
           audit_logs.module,
           audit_logs.entity_type,
           audit_logs.entity_id,
           audit_logs.result,
           audit_logs.created_at,
           users.name AS user_name
         FROM audit_logs
         LEFT JOIN users ON audit_logs.user_id = users.id
         ORDER BY audit_logs.created_at DESC
         LIMIT 5`
      ),

      pool.query("SELECT COUNT(*)::int AS total_suppliers FROM suppliers"),

      pool.query(
        `SELECT COUNT(*)::int AS open_purchase_orders
         FROM purchase_orders
         WHERE status IN ('draft', 'ordered')`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS pending_receipt_purchase_orders
         FROM purchase_orders
         WHERE status = 'ordered'`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS received_purchase_orders
         FROM purchase_orders
         WHERE status = 'received'`
      ),

      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0)::numeric(10,2) AS received_procurement_spend
         FROM purchase_orders
         WHERE status = 'received'`
      ),

      pool.query(
        `SELECT
           purchase_orders.id,
           purchase_orders.status,
           purchase_orders.total_amount,
           purchase_orders.expected_delivery_date,
           purchase_orders.received_at,
           purchase_orders.created_at,
           suppliers.name AS supplier_name
         FROM purchase_orders
         JOIN suppliers ON purchase_orders.supplier_id = suppliers.id
         ORDER BY purchase_orders.created_at DESC
         LIMIT 5`
      ),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        summary: {
          totalProducts: productsResult.rows[0].total_products,
          totalCustomers: customersResult.rows[0].total_customers,
          totalSalesOrders: salesOrdersResult.rows[0].total_sales_orders,
          totalInvoices: invoicesResult.rows[0].total_invoices,
          totalPaidRevenue: paidRevenueResult.rows[0].total_paid_revenue,
          pendingInvoices: pendingInvoicesResult.rows[0].pending_invoices,
          lowStockProducts: lowStockResult.rows[0].low_stock_products,

          totalSuppliers: suppliersResult.rows[0].total_suppliers,
          openPurchaseOrders:
            openPurchaseOrdersResult.rows[0].open_purchase_orders,
          pendingReceiptPurchaseOrders:
            pendingReceiptPurchaseOrdersResult.rows[0]
              .pending_receipt_purchase_orders,
          receivedPurchaseOrders:
            receivedPurchaseOrdersResult.rows[0].received_purchase_orders,
          receivedProcurementSpend:
            receivedProcurementSpendResult.rows[0]
              .received_procurement_spend,

          recentActivity: recentActivityResult.rows,
          recentPurchaseOrders: recentPurchaseOrdersResult.rows,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}