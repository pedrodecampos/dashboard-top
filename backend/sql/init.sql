CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(150),
  value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  platform VARCHAR(60),
  status VARCHAR(60),
  order_type VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders (platform);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders (order_type);

