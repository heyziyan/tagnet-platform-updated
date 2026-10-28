PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0), stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0), status TEXT NOT NULL DEFAULT 'Active', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS profiles (
  slug TEXT UNIQUE NOT NULL, public_id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT DEFAULT '', bio TEXT DEFAULT '', avatar TEXT DEFAULT '', theme TEXT NOT NULL DEFAULT 'editorial', email TEXT DEFAULT '', phone TEXT DEFAULT '', whatsapp TEXT DEFAULT '', instagram TEXT DEFAULT '', linkedin TEXT DEFAULT '', github TEXT DEFAULT '', website TEXT DEFAULT '', location TEXT DEFAULT '', accent TEXT DEFAULT '#b7a0f6', views INTEGER NOT NULL DEFAULT 0, edit_key_hash TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0, nfc_uid TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '', address TEXT NOT NULL, city TEXT NOT NULL, pincode TEXT NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL, qty INTEGER NOT NULL CHECK(qty > 0), total INTEGER NOT NULL CHECK(total >= 0), status TEXT NOT NULL DEFAULT 'Order placed', tracking_code TEXT DEFAULT '', profile_slug TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY(product_id) REFERENCES products(id)
);
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL, status TEXT NOT NULL, note TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE TABLE IF NOT EXISTS profile_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, public_id TEXT NOT NULL, event TEXT NOT NULL DEFAULT 'view', referrer TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_profile_events_id ON profile_events(public_id, created_at DESC);
INSERT OR IGNORE INTO products (id,name,price,stock,status) VALUES
('TK-01','Tagnet NFC Keychain · Cloud',199,48,'Active'),
('TK-02','Tagnet NFC Keychain · Onyx',199,32,'Active'),
('TK-03','Tagnet NFC Keychain · Custom',249,12,'Active');
