import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const PASSWORD = "Password123!";

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const gst = Number((subtotal * 0.1).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    gst,
    total,
  };
}

async function seedDemoData() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("Clearing existing demo data...");

    await client.query(`
      TRUNCATE TABLE
        audit_logs,
        approval_requests,
        inventory_movements,
        payments,
        invoices,
        sales_order_items,
        sales_orders,
        purchase_order_items,
        purchase_orders,
        portal_users,
        customers,
        suppliers,
        products,
        users,
        roles
      RESTART IDENTITY CASCADE
    `);

    console.log("Creating roles and users...");

    const adminRoleResult = await client.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       RETURNING id`,
      ["Admin", "Full system access"]
    );

    const staffRoleResult = await client.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       RETURNING id`,
      ["Staff", "Operational staff access"]
    );

    const adminRoleId = adminRoleResult.rows[0].id;
    const staffRoleId = staffRoleResult.rows[0].id;
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    const adminUserResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, 'active', false)
       RETURNING id`,
      ["Aisha Rahman", "admin@coreflow.test", passwordHash, adminRoleId]
    );

    const staffUserResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, 'active', false)
       RETURNING id`,
      ["Daniel Brooks", "staff@coreflow.test", passwordHash, staffRoleId]
    );

    const adminUserId = adminUserResult.rows[0].id;
    const staffUserId = staffUserResult.rows[0].id;

    console.log("Creating suppliers...");

    const suppliers = [
      ["Freshline Wholesale", "orders@freshline.test", "0400 100 201", "Sydney NSW", "Mia Clarke"],
      ["Metro Office Supplies", "sales@metrooffice.test", "0400 100 202", "Parramatta NSW", "Noah Wilson"],
      ["Harbour Tech Distributors", "accounts@harbourtech.test", "0400 100 203", "North Sydney NSW", "Sophie Lee"],
      ["GreenFarm Produce", "orders@greenfarm.test", "0400 100 204", "Bankstown NSW", "Adam Khan"],
      ["Apex Packaging Co", "supply@apexpress.test", "0400 100 205", "Auburn NSW", "Grace Martin"],
      ["Daily Pantry Goods", "hello@dailypantry.test", "0400 100 206", "Blacktown NSW", "Omar Hossain"],
      ["Urban Cleaning Supply", "team@urbanclean.test", "0400 100 207", "Liverpool NSW", "Emily Davis"],
      ["BluePeak Electronics", "sales@bluepeak.test", "0400 100 208", "Chatswood NSW", "Lucas Brown"],
    ];

    const supplierIds = [];

    for (const supplier of suppliers) {
      const result = await client.query(
        `INSERT INTO suppliers
           (name, email, phone, address, contact_person, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING id`,
        supplier
      );

      supplierIds.push(result.rows[0].id);
    }

    console.log("Creating products...");

    const products = [
      [
        "POS Tablet Display",
        "POS-007",
        "Electronics",
        59.0,
        20,
        8,
        "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Premium Coffee Beans 1kg",
        "COF-001",
        "Beverage",
        34.9,
        8,
        12,
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Chocolate Bar Assortment Box",
        "CHO-019",
        "Snack",
        29.5,
        22,
        10,
        "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Restaurant Tableware Set",
        "TBL-021",
        "Hospitality Supplies",
        49.9,
        12,
        10,
        "https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Sparkling Water Bottles",
        "WAT-003",
        "Beverage",
        22.0,
        6,
        10,
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Receipt Paperwork Bundle",
        "ROL-005",
        "Office",
        14.2,
        9,
        14,
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Compact POS Keyboard",
        "KEY-008",
        "Electronics",
        49.0,
        52,
        20,
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Retail POS Laptop Terminal",
        "LPT-006",
        "Electronics",
        429.0,
        5,
        6,
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Milk Carton 1L",
        "MLK-017",
        "Grocery",
        3.8,
        64,
        25,
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Basmati Rice Bowl Pack",
        "RIC-015",
        "Grocery",
        36.0,
        26,
        10,
        "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Office Label Printer",
        "LBL-024",
        "Electronics",
        189.0,
        4,
        5,
        "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Fresh Tomatoes Pack",
        "TOM-016",
        "Grocery",
        18.8,
        18,
        12,
        "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Recycling Bin 60L",
        "BIN-009",
        "Cleaning",
        64.0,
        11,
        16,
        "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Dark Chocolate Pieces Pack",
        "DCH-020",
        "Snack",
        11.5,
        44,
        16,
        "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Eco Paper Napkins 500 Pack",
        "NAP-022",
        "Packaging",
        18.0,
        17,
        12,
        "https://images.unsplash.com/photo-1603484477859-abe6a73f9366?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Berry Ice Pop Pack",
        "ICE-018",
        "Snack",
        24.5,
        31,
        14,
        "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Natural Soap Bar Pack",
        "SOAP-023",
        "Cleaning",
        21.0,
        6,
        9,
        "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Nitrile Gloves Box",
        "GLV-011",
        "Cleaning",
        27.5,
        7,
        10,
        "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Carpet Cleaning Tool",
        "CLT-012",
        "Cleaning",
        16.0,
        34,
        12,
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Sanitiser and Cleaning Kit",
        "SAN-013",
        "Cleaning",
        19.9,
        14,
        18,
        "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Office Copy Paper A4",
        "PAP-004",
        "Office",
        8.8,
        45,
        20,
        "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Olive Oil Bottle",
        "OIL-014",
        "Grocery",
        42.0,
        10,
        12,
        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Organic Green Tea Set",
        "TEA-002",
        "Beverage",
        18.5,
        38,
        15,
        "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Work Boots Pair",
        "BOT-010",
        "Staff Supplies",
        89.0,
        40,
        18,
        "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?auto=format&fit=crop&w=800&q=80",
      ],
    ];

    const productRows = [];

    for (const product of products) {
      const result = await client.query(
        `INSERT INTO products
          (name, sku, category, price, stock_quantity, low_stock_level, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, price, image_url`,
        product
      );

      productRows.push(result.rows[0]);
    }

    console.log("Creating customers...");

    const customers = [
      ["Northside Cafe", "accounts@northsidecafe.test", "0411 001 001", "Surry Hills NSW"],
      ["Urban Grocer", "orders@urbangrocer.test", "0411 001 002", "Newtown NSW"],
      ["Harbour Deli", "hello@harbourdeli.test", "0411 001 003", "Barangaroo NSW"],
      ["Campus Mart", "admin@campusmart.test", "0411 001 004", "Ultimo NSW"],
      ["Green Bowl Kitchen", "team@greenbowl.test", "0411 001 005", "Parramatta NSW"],
      ["Metro Convenience", "owner@metroconv.test", "0411 001 006", "Chatswood NSW"],
      ["Daily Brew", "orders@dailybrew.test", "0411 001 007", "Redfern NSW"],
      ["Blue Lane Store", "sales@bluelane.test", "0411 001 008", "Burwood NSW"],
      ["Fresh Stop", "contact@freshstop.test", "0411 001 009", "Bankstown NSW"],
      ["Local Pantry", "hello@localpantry.test", "0411 001 010", "Auburn NSW"],
      ["Corner Basket", "admin@cornerbasket.test", "0411 001 011", "Liverpool NSW"],
      ["Station Eats", "manager@stationeats.test", "0411 001 012", "Strathfield NSW"],
      ["Sunrise Foods", "orders@sunrisefoods.test", "0411 001 013", "Blacktown NSW"],
      ["Market Lane", "team@marketlane.test", "0411 001 014", "Ryde NSW"],
      ["One Stop Mini Mart", "sales@onestop.test", "0411 001 015", "Marrickville NSW"],
      ["Healthy Corner", "hello@healthycorner.test", "0411 001 016", "Ashfield NSW"],
      ["Budget Bites", "orders@budgetbites.test", "0411 001 017", "Lakemba NSW"],
      ["City Kiosk", "contact@citykiosk.test", "0411 001 018", "Town Hall NSW"],
    ];

    const customerIds = [];

    for (const customer of customers) {
      const result = await client.query(
        `INSERT INTO customers (name, email, phone, address)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        customer
      );

      customerIds.push(result.rows[0].id);
    }

    console.log("Creating customer and supplier portal users...");

    for (let index = 0; index < 6; index += 1) {
      await client.query(
        `INSERT INTO portal_users
           (role, name, email, password_hash, phone, customer_id, email_verified)
         VALUES ('customer', $1, $2, $3, $4, $5, true)`,
        [
          customers[index][0],
          `portal.customer${index + 1}@coreflow.test`,
          passwordHash,
          customers[index][2],
          customerIds[index],
        ]
      );
    }

    for (let index = 0; index < 3; index += 1) {
      await client.query(
        `INSERT INTO portal_users
           (role, name, email, password_hash, phone, supplier_id, email_verified)
         VALUES ('supplier', $1, $2, $3, $4, $5, true)`,
        [
          suppliers[index][0],
          `portal.supplier${index + 1}@coreflow.test`,
          passwordHash,
          suppliers[index][2],
          supplierIds[index],
        ]
      );
    }

    console.log("Creating sales orders, items, invoices, and payments...");

    const salesOrders = [
      { days: 28, customer: 0, status: "paid", items: [[0, 3], [8, 5], [14, 2]] },
      { days: 27, customer: 1, status: "delivered", items: [[1, 4], [9, 6], [16, 10]] },
      { days: 26, customer: 2, status: "paid", items: [[3, 12], [4, 4], [7, 8]] },
      { days: 24, customer: 3, status: "confirmed", items: [[5, 1], [6, 2], [21, 8]] },
      { days: 23, customer: 4, status: "delivered", items: [[13, 2], [15, 6], [18, 4]] },
      { days: 22, customer: 5, status: "paid", items: [[0, 2], [10, 3], [12, 5]] },
      { days: 20, customer: 6, status: "paid", items: [[1, 8], [17, 5], [19, 6]] },
      { days: 19, customer: 7, status: "confirmed", items: [[2, 4], [8, 4], [20, 8]] },
      { days: 18, customer: 8, status: "delivered", items: [[14, 3], [16, 12], [22, 3]] },
      { days: 17, customer: 9, status: "paid", items: [[3, 15], [4, 5], [7, 10]] },
      { days: 15, customer: 10, status: "paid", items: [[0, 4], [1, 6], [18, 5]] },
      { days: 14, customer: 11, status: "delivered", items: [[5, 1], [7, 12], [23, 1]] },
      { days: 13, customer: 12, status: "confirmed", items: [[9, 9], [11, 4], [21, 10]] },
      { days: 12, customer: 13, status: "paid", items: [[13, 3], [15, 8], [19, 8]] },
      { days: 10, customer: 14, status: "delivered", items: [[0, 3], [8, 7], [10, 2]] },
      { days: 9, customer: 15, status: "paid", items: [[1, 5], [14, 2], [16, 8]] },
      { days: 8, customer: 16, status: "confirmed", items: [[3, 10], [4, 8], [22, 2]] },
      { days: 7, customer: 17, status: "delivered", items: [[6, 2], [7, 14], [20, 6]] },
      { days: 6, customer: 0, status: "paid", items: [[0, 5], [18, 6], [19, 5]] },
      { days: 5, customer: 2, status: "placed", items: [[8, 5], [9, 6], [21, 5]] },
      { days: 4, customer: 4, status: "confirmed", items: [[13, 2], [15, 6], [16, 12]] },
      { days: 3, customer: 6, status: "placed", items: [[0, 3], [1, 4], [10, 2]] },
      { days: 2, customer: 8, status: "delivered", items: [[3, 8], [7, 8], [12, 4]] },
      { days: 1, customer: 10, status: "confirmed", items: [[5, 1], [23, 1], [22, 3]] },
    ];

    let invoiceCounter = 1001;

    for (const order of salesOrders) {
      const createdAt = daysAgo(order.days);

      const items = order.items.map(([productIndex, quantity]) => {
        const product = productRows[productIndex];

        return {
          productId: product.id,
          quantity,
          unitPrice: Number(product.price),
        };
      });

      const totals = calculateTotals(items);

      const orderResult = await client.query(
        `INSERT INTO sales_orders
           (customer_id, created_by, delivered_by, status, subtotal, gst_amount, total_amount, delivered_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING id`,
        [
          customerIds[order.customer],
          staffUserId,
          ["delivered", "paid"].includes(order.status) ? staffUserId : null,
          order.status,
          totals.subtotal,
          totals.gst,
          totals.total,
          ["delivered", "paid"].includes(order.status) ? addDays(createdAt, 1) : null,
          createdAt,
        ]
      );

      const salesOrderId = orderResult.rows[0].id;

      for (const item of items) {
        const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));

        await client.query(
          `INSERT INTO sales_order_items
             (sales_order_id, product_id, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [salesOrderId, item.productId, item.quantity, item.unitPrice, lineTotal]
        );

        if (["delivered", "paid"].includes(order.status)) {
          await client.query(
            `INSERT INTO inventory_movements
               (product_id, movement_type, quantity_change, reason, related_sales_order_id, created_by, created_at)
             VALUES ($1, 'sale', $2, $3, $4, $5, $6)`,
            [
              item.productId,
              -item.quantity,
              "Stock deducted after customer order delivery",
              salesOrderId,
              staffUserId,
              addDays(createdAt, 1),
            ]
          );
        }
      }

      if (order.status !== "placed") {
        const invoiceStatus = order.status === "paid" ? "paid" : "pending";

        const invoiceResult = await client.query(
          `INSERT INTO invoices
             (sales_order_id, invoice_number, subtotal, gst_amount, total_amount, status, issued_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $7)
           RETURNING id`,
          [
            salesOrderId,
            `INV-${invoiceCounter}`,
            totals.subtotal,
            totals.gst,
            totals.total,
            invoiceStatus,
            createdAt,
          ]
        );

        invoiceCounter += 1;

        if (invoiceStatus === "paid") {
          await client.query(
            `INSERT INTO payments
               (invoice_id, status, amount, payment_method, paid_at, created_at, updated_at)
             VALUES ($1, 'paid', $2, 'bank_transfer', $3, $3, $3)`,
            [invoiceResult.rows[0].id, totals.total, addDays(createdAt, 2)]
          );
        }
      }
    }

    console.log("Creating purchase orders...");

    const purchaseOrders = [
      { days: 30, supplier: 0, status: "received", items: [[0, 20, 22], [1, 30, 10]] },
      { days: 26, supplier: 1, status: "received", items: [[3, 60, 5], [4, 30, 8]] },
      { days: 24, supplier: 2, status: "ordered", items: [[5, 8, 85], [23, 5, 130]] },
      { days: 21, supplier: 3, status: "supplier_delivered", items: [[14, 20, 24], [15, 30, 16]] },
      { days: 18, supplier: 4, status: "received", items: [[8, 40, 19], [9, 60, 14]] },
      { days: 15, supplier: 5, status: "ordered", items: [[16, 80, 2], [17, 30, 10]] },
      { days: 12, supplier: 6, status: "cancelled", items: [[10, 15, 18], [12, 20, 12]] },
      { days: 9, supplier: 7, status: "received", items: [[6, 10, 40], [7, 80, 7]] },
      { days: 6, supplier: 0, status: "ordered", items: [[0, 25, 22], [2, 30, 13]] },
      { days: 3, supplier: 4, status: "supplier_delivered", items: [[21, 50, 10], [22, 20, 13]] },
    ];

    for (const order of purchaseOrders) {
      const createdAt = daysAgo(order.days);

      const items = order.items.map(([productIndex, quantity, unitCost]) => ({
        productId: productRows[productIndex].id,
        quantity,
        unitPrice: unitCost,
      }));

      const totals = calculateTotals(items);

      const purchaseOrderResult = await client.query(
        `INSERT INTO purchase_orders
           (supplier_id, created_by, status, subtotal, gst_amount, total_amount,
            expected_delivery_date, supplier_delivered_at, supplier_delivery_note,
            received_at, received_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
         RETURNING id`,
        [
          supplierIds[order.supplier],
          adminUserId,
          order.status,
          totals.subtotal,
          totals.gst,
          totals.total,
          addDays(createdAt, 7),
          ["supplier_delivered", "received"].includes(order.status)
            ? addDays(createdAt, 5)
            : null,
          ["supplier_delivered", "received"].includes(order.status)
            ? "Supplier confirmed delivery for this purchase order."
            : null,
          order.status === "received" ? addDays(createdAt, 7) : null,
          order.status === "received" ? staffUserId : null,
          createdAt,
        ]
      );

      const purchaseOrderId = purchaseOrderResult.rows[0].id;

      for (const item of items) {
        const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));

        await client.query(
          `INSERT INTO purchase_order_items
             (purchase_order_id, product_id, quantity, unit_cost, line_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [purchaseOrderId, item.productId, item.quantity, item.unitPrice, lineTotal]
        );

        if (order.status === "received") {
          await client.query(
            `INSERT INTO inventory_movements
               (product_id, movement_type, quantity_change, reason, related_purchase_order_id, created_by, created_at)
             VALUES ($1, 'purchase_receive', $2, 'Stock received from purchase order', $3, $4, $5)`,
            [
              item.productId,
              item.quantity,
              purchaseOrderId,
              staffUserId,
              addDays(createdAt, 7),
            ]
          );
        }
      }
    }

    console.log("Creating approval requests...");

    const approvalRequests = [
      {
        productIndex: 0,
        status: "pending",
        actionType: "stock_adjustment",
        reason: "Stock count mismatch after manual warehouse check.",
        requestData: { quantityChange: -2, reason: "Damaged stock found" },
        days: 2,
      },
      {
        productIndex: 10,
        status: "pending",
        actionType: "stock_adjustment",
        reason: "Urgent adjustment requested after cleaning supply audit.",
        requestData: { quantityChange: -1, reason: "Spillage during storage" },
        days: 1,
      },
      {
        productIndex: 4,
        status: "approved",
        actionType: "stock_adjustment",
        reason: "Approved correction after supplier quantity reconciliation.",
        requestData: { quantityChange: 3, reason: "Supplier over-delivered" },
        reviewNote: "Approved after checking purchase order receipt.",
        days: 8,
      },
      {
        productIndex: 22,
        status: "rejected",
        actionType: "stock_adjustment",
        reason: "Requested adjustment did not match movement evidence.",
        requestData: { quantityChange: -5, reason: "Unverified shrinkage" },
        reviewNote: "Rejected because no audit evidence was attached.",
        days: 11,
      },
    ];

    for (const request of approvalRequests) {
      await client.query(
        `INSERT INTO approval_requests
           (requested_by, reviewed_by, action_type, entity_type, entity_id,
            status, request_data, reason, review_note, reviewed_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'product', $4, $5, $6, $7, $8, $9, $10, $10)`,
        [
          staffUserId,
          request.status === "pending" ? null : adminUserId,
          request.actionType,
          productRows[request.productIndex].id,
          request.status,
          request.requestData,
          request.reason,
          request.reviewNote || null,
          request.status === "pending" ? null : addDays(daysAgo(request.days), 1),
          daysAgo(request.days),
        ]
      );
    }

    console.log("Creating audit logs...");

    const auditLogs = [
      [adminUserId, "LOGIN", "auth", "user", adminUserId, "success", daysAgo(8)],
      [staffUserId, "LOGIN", "auth", "user", staffUserId, "success", daysAgo(8)],
      [staffUserId, "CREATE_SALES_ORDER", "sales_orders", "sales_order", 1, "success", daysAgo(7)],
      [staffUserId, "DELIVER_SALES_ORDER", "sales_orders", "sales_order", 2, "success", daysAgo(6)],
      [adminUserId, "CREATE_PURCHASE_ORDER", "purchase_orders", "purchase_order", 1, "success", daysAgo(6)],
      [staffUserId, "RECEIVE_PURCHASE_ORDER", "purchase_orders", "purchase_order", 1, "success", daysAgo(5)],
      [staffUserId, "REQUEST_INVENTORY_ADJUSTMENT", "approvals", "approval_request", 1, "success", daysAgo(4)],
      [adminUserId, "APPROVE_INVENTORY_ADJUSTMENT", "approvals", "approval_request", 3, "success", daysAgo(3)],
      [staffUserId, "LOGIN", "auth", "user", staffUserId, "failed", `${daysAgo(1)} 23:05:00`],
      [staffUserId, "LOGIN", "auth", "user", staffUserId, "failed", `${daysAgo(1)} 23:08:00`],
      [staffUserId, "LOGIN", "auth", "user", staffUserId, "failed", `${daysAgo(1)} 23:10:00`],
      [staffUserId, "UPDATE_PURCHASE_ORDER_STATUS", "purchase_orders", "purchase_order", 4, "success", `${daysAgo(1)} 22:40:00`],
      [staffUserId, "DELETE_PRODUCT", "products", "product", 3, "failed", `${daysAgo(1)} 22:45:00`],
    ];

    for (const log of auditLogs) {
      await client.query(
        `INSERT INTO audit_logs
           (user_id, action, module, entity_type, entity_id, result, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        log
      );
    }

    await client.query("COMMIT");

    console.log("Demo seed data created successfully.");
    console.log("");
    console.log("Login accounts:");
    console.log(`Admin: admin@coreflow.test / ${PASSWORD}`);
    console.log(`Staff: staff@coreflow.test / ${PASSWORD}`);
    console.log(`Customer portal: portal.customer1@coreflow.test / ${PASSWORD}`);
    console.log(`Supplier portal: portal.supplier1@coreflow.test / ${PASSWORD}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed demo data:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoData();