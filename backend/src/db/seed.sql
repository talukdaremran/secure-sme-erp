-- Secure SME ERP - Version 1 Seed Data

INSERT INTO roles (name, description)
VALUES
    ('Admin', 'Full system access including user management, dashboard, and audit logs'),
    ('Staff', 'Limited access for daily ERP operations')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, sku, category, price, stock_quantity, low_stock_level)
VALUES
    ('Wireless Mouse', 'SKU-MOUSE-001', 'Electronics', 25.00, 50, 10),
    ('USB-C Cable', 'SKU-CABLE-001', 'Accessories', 12.50, 100, 20),
    ('Office Chair', 'SKU-CHAIR-001', 'Furniture', 149.99, 15, 5),
    ('Notebook Pack', 'SKU-NOTE-001', 'Stationery', 8.99, 80, 15)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (name, email, phone, address)
VALUES
    ('ABC Retail Pty Ltd', 'contact@abcretail.com', '0400000001', 'Sydney, NSW'),
    ('Northside Office Supplies', 'admin@northsideoffice.com', '0400000002', 'Parramatta, NSW'),
    ('Blue Harbour Trading', 'hello@blueharbour.com', '0400000003', 'Chatswood, NSW');