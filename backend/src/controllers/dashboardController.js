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

      pendingApprovalsResult,
      approvedApprovalsResult,
      rejectedApprovalsResult,
      recentApprovalRequestsResult,
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

      pool.query(
        `SELECT COUNT(*)::int AS pending_approvals
        FROM approval_requests
        WHERE status = 'pending'`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS approved_approvals
        FROM approval_requests
        WHERE status = 'approved'`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS rejected_approvals
        FROM approval_requests
        WHERE status = 'rejected'`
      ),

      pool.query(
        `SELECT
          approval_requests.id,
          approval_requests.action_type,
          approval_requests.status,
          approval_requests.reason,
          approval_requests.created_at,
          approval_requests.reviewed_at,
          requested_by_user.name AS requested_by_name,
          reviewed_by_user.name AS reviewed_by_name,
          products.name AS product_name
        FROM approval_requests
        LEFT JOIN users AS requested_by_user
          ON approval_requests.requested_by = requested_by_user.id
        LEFT JOIN users AS reviewed_by_user
          ON approval_requests.reviewed_by = reviewed_by_user.id
        LEFT JOIN products
          ON approval_requests.entity_type = 'product'
          AND approval_requests.entity_id = products.id
        ORDER BY approval_requests.created_at DESC
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

          pendingApprovals: pendingApprovalsResult.rows[0].pending_approvals,
          approvedApprovals: approvedApprovalsResult.rows[0].approved_approvals,
          rejectedApprovals: rejectedApprovalsResult.rows[0].rejected_approvals,
          recentApprovalRequests: recentApprovalRequestsResult.rows,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardBi(req, res, next) {
  try {
    const [
      salesTrendResult,
      salesOrderStatusResult,
      invoiceStatusResult,
      purchaseOrderStatusResult,
      inventoryRiskResult,
      topProductsResult,
      customerActivityResult,
      procurementSpendTrendResult,
    ] = await Promise.all([
      pool.query(
        `SELECT
           TO_CHAR(DATE(sales_orders.created_at), 'Mon DD') AS label,
           DATE(sales_orders.created_at) AS sales_date,
           COALESCE(SUM(sales_orders.total_amount), 0)::float AS revenue,
           COUNT(sales_orders.id)::int AS order_count
         FROM sales_orders
         WHERE sales_orders.status IN ('placed', 'confirmed', 'paid', 'delivered')
           AND sales_orders.created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY DATE(sales_orders.created_at)
         ORDER BY DATE(sales_orders.created_at) ASC`
      ),

      pool.query(
        `SELECT
           status,
           COUNT(*)::int AS count
         FROM sales_orders
         GROUP BY status
         ORDER BY count DESC`
      ),

      pool.query(
        `SELECT
           status,
           COUNT(*)::int AS count,
           COALESCE(SUM(total_amount), 0)::float AS total_amount
         FROM invoices
         GROUP BY status
         ORDER BY count DESC`
      ),

      pool.query(
        `SELECT
           status,
           COUNT(*)::int AS count,
           COALESCE(SUM(total_amount), 0)::float AS total_amount
         FROM purchase_orders
         GROUP BY status
         ORDER BY count DESC`
      ),

      pool.query(
        `WITH inventory_risk AS (
          SELECT
            CASE
              WHEN stock_quantity <= low_stock_level THEN 'Low stock'
              WHEN stock_quantity <= (low_stock_level * 2) THEN 'Watch'
              ELSE 'Healthy'
            END AS risk_level
          FROM products
        )
        SELECT
          risk_level,
          COUNT(*)::int AS count
        FROM inventory_risk
        GROUP BY risk_level
        ORDER BY
          CASE
            WHEN risk_level = 'Low stock' THEN 1
            WHEN risk_level = 'Watch' THEN 2
            ELSE 3
          END`
      ),

      pool.query(
        `SELECT
          products.id,
          products.name,
          COALESCE(SUM(sales_order_items.quantity), 0)::int AS quantity_sold,
          COALESCE(SUM(sales_order_items.line_total), 0)::float AS revenue
        FROM products
        LEFT JOIN sales_order_items
          ON products.id = sales_order_items.product_id
        LEFT JOIN sales_orders
          ON sales_order_items.sales_order_id = sales_orders.id
        WHERE sales_orders.status IN ('confirmed', 'paid', 'delivered')
            OR sales_orders.id IS NULL
        GROUP BY products.id, products.name
        ORDER BY quantity_sold DESC, revenue DESC
        LIMIT 5`
      ),

      pool.query(
        `WITH customer_activity AS (
          SELECT
            customers.id,
            CASE
              WHEN MAX(sales_orders.created_at) IS NULL THEN 'Inactive'
              WHEN MAX(sales_orders.created_at) < CURRENT_DATE - INTERVAL '60 days' THEN 'Inactive'
              WHEN MAX(sales_orders.created_at) < CURRENT_DATE - INTERVAL '30 days' THEN 'At risk'
              ELSE 'Active'
            END AS activity_status
          FROM customers
          LEFT JOIN sales_orders
            ON customers.id = sales_orders.customer_id
            AND sales_orders.status IN ('placed', 'confirmed', 'paid', 'delivered')
          GROUP BY customers.id
        )
        SELECT
          activity_status,
          COUNT(*)::int AS count
        FROM customer_activity
        GROUP BY activity_status
        ORDER BY
          CASE
            WHEN activity_status = 'Active' THEN 1
            WHEN activity_status = 'At risk' THEN 2
            ELSE 3
          END`
      ),

      pool.query(
        `SELECT
           TO_CHAR(DATE(purchase_orders.created_at), 'Mon DD') AS label,
           DATE(purchase_orders.created_at) AS purchase_date,
           COALESCE(SUM(purchase_orders.total_amount), 0)::float AS spend,
           COUNT(purchase_orders.id)::int AS purchase_order_count
         FROM purchase_orders
         WHERE purchase_orders.created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY DATE(purchase_orders.created_at)
         ORDER BY DATE(purchase_orders.created_at) ASC`
      ),
    ]);

    const customerActivityMap = customerActivityResult.rows.reduce(
      (accumulator, row) => {
        accumulator[row.activity_status] =
          (accumulator[row.activity_status] || 0) + Number(row.count || 0);

        return accumulator;
      },
      {}
    );

    const customerActivityBreakdown = customerActivityResult.rows;

    res.status(200).json({
      status: "success",
      data: {
        bi: {
          salesTrend: salesTrendResult.rows,
          salesOrderStatusBreakdown: salesOrderStatusResult.rows,
          invoiceStatusBreakdown: invoiceStatusResult.rows,
          purchaseOrderStatusBreakdown: purchaseOrderStatusResult.rows,
          inventoryRiskBreakdown: inventoryRiskResult.rows,
          topProducts: topProductsResult.rows,
          customerActivityBreakdown,
          procurementSpendTrend: procurementSpendTrendResult.rows,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}