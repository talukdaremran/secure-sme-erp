import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { sendPortalVerificationEmail } from "../utils/portalEmail.js";

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

function getPortalJwtSecret() {
  return process.env.PORTAL_JWT_SECRET || process.env.JWT_SECRET;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generatePortalToken(portalUser) {
  return jwt.sign(
    {
      id: portalUser.id,
      role: portalUser.role,
      email: portalUser.email,
      type: "portal",
    },
    getPortalJwtSecret(),
    {
      expiresIn: "1d",
    }
  );
}

function buildPortalUserResponse(portalUser) {
  return {
    id: portalUser.id,
    role: portalUser.role,
    name: portalUser.name,
    email: portalUser.email,
    phone: portalUser.phone,
    customer_id: portalUser.customer_id,
    supplier_id: portalUser.supplier_id,
    email_verified: portalUser.email_verified,
    last_login_at: portalUser.last_login_at,
    created_at: portalUser.created_at,
  };
}

async function registerPortalUser(req, res, next, role) {
  const client = await pool.connect();

  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Name is required",
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Valid email is required",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters",
      });
    }

    const normalisedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    await client.query("BEGIN");

    const existingPortalUser = await client.query(
      "SELECT id FROM portal_users WHERE email = $1",
      [normalisedEmail]
    );

    if (existingPortalUser.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "A portal account already exists with this email",
      });
    }

    let customerId = null;
    let supplierId = null;

    if (role === "customer") {
      const existingCustomerResult = await client.query(
        "SELECT id FROM customers WHERE email = $1 ORDER BY id ASC LIMIT 1",
        [normalisedEmail]
      );

      if (existingCustomerResult.rows.length > 0) {
        const customerResult = await client.query(
          `UPDATE customers
          SET name = $1,
              phone = COALESCE($2, phone),
              address = COALESCE($3, address),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id`,
          [
            trimmedName,
            phone || null,
            address || null,
            existingCustomerResult.rows[0].id,
          ]
        );

        customerId = customerResult.rows[0].id;
      } else {
        const customerResult = await client.query(
          `INSERT INTO customers (name, email, phone, address)
          VALUES ($1, $2, $3, $4)
          RETURNING id`,
          [trimmedName, normalisedEmail, phone || null, address || null]
        );

        customerId = customerResult.rows[0].id;
      }
    }

    if (role === "supplier") {
      const existingSupplierResult = await client.query(
        "SELECT id FROM suppliers WHERE email = $1 ORDER BY id ASC LIMIT 1",
        [normalisedEmail]
      );

      if (existingSupplierResult.rows.length > 0) {
        const supplierResult = await client.query(
          `UPDATE suppliers
          SET name = $1,
              phone = COALESCE($2, phone),
              contact_person = COALESCE($3, contact_person),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id`,
          [
            trimmedName,
            phone || null,
            trimmedName,
            existingSupplierResult.rows[0].id,
          ]
        );

        supplierId = supplierResult.rows[0].id;
      } else {
        const supplierResult = await client.query(
          `INSERT INTO suppliers (name, email, phone, contact_person, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id`,
          [trimmedName, normalisedEmail, phone || null, trimmedName, "active"]
        );

        supplierId = supplierResult.rows[0].id;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);

    const portalUserResult = await client.query(
      `INSERT INTO portal_users (
         role,
         name,
         email,
         password_hash,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         verification_code_hash,
         verification_code_expires_at
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         false,
         $8,
         CURRENT_TIMESTAMP + INTERVAL '${VERIFICATION_CODE_EXPIRY_MINUTES} minutes'
       )
       RETURNING
         id,
         role,
         name,
         email,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         last_login_at,
         created_at`,
      [
        role,
        trimmedName,
        normalisedEmail,
        passwordHash,
        phone || null,
        customerId,
        supplierId,
        verificationCodeHash,
      ]
    );

    const portalUser = portalUserResult.rows[0];

    await createAuditLog(
      {
        userId: null,
        action:
          role === "customer"
            ? "REGISTER_CUSTOMER_PORTAL_USER"
            : "REGISTER_SUPPLIER_PORTAL_USER",
        module: "portal_auth",
        entityType: "portal_user",
        entityId: portalUser.id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    await sendPortalVerificationEmail({
      to: normalisedEmail,
      name: trimmedName,
      code: verificationCode,
      role,
    });

    res.status(201).json({
      status: "success",
      message:
        "Portal account created successfully. Please verify your email using the verification code.",
      data: {
        portalUser: buildPortalUserResponse(portalUser),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function registerCustomerPortalUser(req, res, next) {
  return registerPortalUser(req, res, next, "customer");
}

export async function registerSupplierPortalUser(req, res, next) {
  return registerPortalUser(req, res, next, "supplier");
}

export async function verifyPortalEmail(req, res, next) {
  const client = await pool.connect();

  try {
    const { email, code } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Valid email is required",
      });
    }

    if (!code || !String(code).trim()) {
      return res.status(400).json({
        status: "error",
        message: "Verification code is required",
      });
    }

    const normalisedEmail = email.trim().toLowerCase();

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT
         id,
         role,
         name,
         email,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         verification_code_hash,
         verification_code_expires_at,
         last_login_at,
         created_at
       FROM portal_users
       WHERE email = $1
       FOR UPDATE`,
      [normalisedEmail]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "Portal user not found",
      });
    }

    const portalUser = result.rows[0];

    if (portalUser.email_verified) {
      await client.query("ROLLBACK");

      return res.status(200).json({
        status: "success",
        message: "Email is already verified",
        data: {
          portalUser: buildPortalUserResponse(portalUser),
        },
      });
    }

    if (
      !portalUser.verification_code_hash ||
      !portalUser.verification_code_expires_at ||
      new Date(portalUser.verification_code_expires_at) < new Date()
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Verification code has expired. Please register again for now.",
      });
    }

    const isCodeValid = await bcrypt.compare(
      String(code).trim(),
      portalUser.verification_code_hash
    );

    if (!isCodeValid) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Invalid verification code",
      });
    }

    const updatedResult = await client.query(
      `UPDATE portal_users
       SET email_verified = true,
           verification_code_hash = NULL,
           verification_code_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING
         id,
         role,
         name,
         email,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         last_login_at,
         created_at`,
      [portalUser.id]
    );

    await createAuditLog(
      {
        userId: null,
        action: "VERIFY_PORTAL_EMAIL",
        module: "portal_auth",
        entityType: "portal_user",
        entityId: portalUser.id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Email verified successfully. You can now log in.",
      data: {
        portalUser: buildPortalUserResponse(updatedResult.rows[0]),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function loginPortalUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Valid email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Password is required",
      });
    }

    const normalisedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT
         id,
         role,
         name,
         email,
         password_hash,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         last_login_at,
         created_at
       FROM portal_users
       WHERE email = $1`,
      [normalisedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const portalUser = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      portalUser.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    if (!portalUser.email_verified) {
      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in",
      });
    }

    const updatedResult = await pool.query(
      `UPDATE portal_users
       SET last_login_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING
         id,
         role,
         name,
         email,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         last_login_at,
         created_at`,
      [portalUser.id]
    );

    const updatedPortalUser = updatedResult.rows[0];
    const token = generatePortalToken(updatedPortalUser);

    await createAuditLog({
      userId: null,
      action: "LOGIN_PORTAL_USER",
      module: "portal_auth",
      entityType: "portal_user",
      entityId: updatedPortalUser.id,
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Portal login successful",
      data: {
        token,
        portalUser: buildPortalUserResponse(updatedPortalUser),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentPortalUser(req, res, next) {
  try {
    res.status(200).json({
      status: "success",
      data: {
        portalUser: buildPortalUserResponse(req.portalUser),
      },
    });
  } catch (error) {
    next(error);
  }
}