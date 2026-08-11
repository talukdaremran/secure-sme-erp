import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export async function createInventoryAdjustmentRequest(req, res, next) {
  try {
    const { product_id, quantity_change, reason } = req.body;

    const productId = Number(product_id);
    const quantityChange = Number(quantity_change);

    if (!productId || !Number.isInteger(productId)) {
      return res.status(400).json({
        status: "error",
        message: "Valid product is required",
      });
    }

    if (!Number.isInteger(quantityChange) || quantityChange === 0) {
      return res.status(400).json({
        status: "error",
        message: "Quantity change must be a non-zero whole number",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Reason is required",
      });
    }

    const productResult = await pool.query(
      "SELECT id, name, stock_quantity FROM products WHERE id = $1",
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const requestData = {
      product_id: productId,
      quantity_change: quantityChange,
      reason: reason.trim(),
    };

    const result = await pool.query(
      `INSERT INTO approval_requests (
         requested_by,
         action_type,
         entity_type,
         entity_id,
         status,
         request_data,
         reason
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         requested_by,
         reviewed_by,
         action_type,
         entity_type,
         entity_id,
         status,
         request_data,
         reason,
         review_note,
         reviewed_at,
         created_at,
         updated_at`,
      [
        req.user.id,
        "inventory_adjustment",
        "product",
        productId,
        APPROVAL_STATUS.PENDING,
        requestData,
        reason.trim(),
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      action: "REQUEST_INVENTORY_ADJUSTMENT",
      module: "approvals",
      entityType: "approval_request",
      entityId: result.rows[0].id,
      result: "success",
    });

    res.status(201).json({
      status: "success",
      message: "Inventory adjustment request created successfully",
      data: {
        approvalRequest: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovalRequests(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         approval_requests.id,
         approval_requests.action_type,
         approval_requests.entity_type,
         approval_requests.entity_id,
         approval_requests.status,
         approval_requests.request_data,
         approval_requests.reason,
         approval_requests.review_note,
         approval_requests.reviewed_at,
         approval_requests.created_at,
         approval_requests.updated_at,
         requested_by_user.name AS requested_by_name,
         reviewed_by_user.name AS reviewed_by_name,
         products.name AS product_name,
         products.sku AS product_sku,
         products.stock_quantity AS current_stock_quantity
       FROM approval_requests
       LEFT JOIN users AS requested_by_user
         ON approval_requests.requested_by = requested_by_user.id
       LEFT JOIN users AS reviewed_by_user
         ON approval_requests.reviewed_by = reviewed_by_user.id
       LEFT JOIN products
         ON approval_requests.entity_type = 'product'
        AND approval_requests.entity_id = products.id
       ORDER BY approval_requests.created_at DESC`
    );

    res.status(200).json({
      status: "success",
      data: {
        approvalRequests: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function approveApprovalRequest(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { review_note } = req.body;

    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT *
       FROM approval_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Approval request not found",
      });
    }

    const approvalRequest = requestResult.rows[0];

    if (approvalRequest.status !== APPROVAL_STATUS.PENDING) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Only pending approval requests can be approved",
      });
    }

    if (approvalRequest.action_type !== "inventory_adjustment") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Unsupported approval request type",
      });
    }

    const requestData = approvalRequest.request_data;
    const productId = Number(requestData.product_id);
    const quantityChange = Number(requestData.quantity_change);
    const reason = requestData.reason || approvalRequest.reason;

    const productResult = await client.query(
      `SELECT id, name, stock_quantity
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const currentStock = Number(productResult.rows[0].stock_quantity);
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Approval would make product stock negative",
      });
    }

    await client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantityChange, productId]
    );

    await client.query(
      `INSERT INTO inventory_movements (
         product_id,
         movement_type,
         quantity_change,
         reason,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        productId,
        "approved_adjustment",
        quantityChange,
        `Approved adjustment request #${id}: ${reason}`,
        req.user.id,
      ]
    );

    const updatedRequestResult = await client.query(
      `UPDATE approval_requests
       SET status = $1,
           reviewed_by = $2,
           review_note = $3,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING
         id,
         requested_by,
         reviewed_by,
         action_type,
         entity_type,
         entity_id,
         status,
         request_data,
         reason,
         review_note,
         reviewed_at,
         created_at,
         updated_at`,
      [
        APPROVAL_STATUS.APPROVED,
        req.user.id,
        review_note || null,
        id,
      ]
    );

    await createAuditLog(
      {
        userId: req.user.id,
        action: "APPROVE_INVENTORY_ADJUSTMENT",
        module: "approvals",
        entityType: "approval_request",
        entityId: Number(id),
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Approval request approved successfully",
      data: {
        approvalRequest: updatedRequestResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function rejectApprovalRequest(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { review_note } = req.body;

    if (!review_note || !review_note.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Review note is required when rejecting a request",
      });
    }

    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT *
       FROM approval_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Approval request not found",
      });
    }

    const approvalRequest = requestResult.rows[0];

    if (approvalRequest.status !== APPROVAL_STATUS.PENDING) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Only pending approval requests can be rejected",
      });
    }

    const updatedRequestResult = await client.query(
      `UPDATE approval_requests
       SET status = $1,
           reviewed_by = $2,
           review_note = $3,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING
         id,
         requested_by,
         reviewed_by,
         action_type,
         entity_type,
         entity_id,
         status,
         request_data,
         reason,
         review_note,
         reviewed_at,
         created_at,
         updated_at`,
      [
        APPROVAL_STATUS.REJECTED,
        req.user.id,
        review_note.trim(),
        id,
      ]
    );

    await createAuditLog(
      {
        userId: req.user.id,
        action: "REJECT_INVENTORY_ADJUSTMENT",
        module: "approvals",
        entityType: "approval_request",
        entityId: Number(id),
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Approval request rejected successfully",
      data: {
        approvalRequest: updatedRequestResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}