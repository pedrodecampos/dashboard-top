const { query } = require("../db");
const { getRangeFromPreset } = require("../utils/dateRanges");

const mapDateRange = (preset) => {
  const { start, end } = getRangeFromPreset(preset);
  return {
    start: start ? start.toISOString() : null,
    end: end ? end.toISOString() : null,
  };
};

async function upsertOrder(order) {
  const {
    order_id,
    customer_name,
    value,
    platform,
    status,
    order_type,
    created_at,
    raw_payload,
  } = order;

  const text = `
    INSERT INTO orders (order_id, customer_name, value, platform, status, order_type, created_at, raw_payload)
    VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), $8)
    ON CONFLICT (order_id)
    DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      value = EXCLUDED.value,
      platform = EXCLUDED.platform,
      status = EXCLUDED.status,
      order_type = EXCLUDED.order_type,
      created_at = COALESCE(EXCLUDED.created_at, orders.created_at),
      raw_payload = EXCLUDED.raw_payload,
      updated_at = NOW()
    RETURNING *;
  `;

  const params = [
    order_id,
    customer_name,
    value,
    platform,
    status,
    order_type,
    created_at,
    raw_payload,
  ];

  const { rows } = await query(text, params);
  return rows[0];
}

async function listOrders({ platform, datePreset = "all", limit = 200 }) {
  const { start, end } = mapDateRange(datePreset);

  const text = `
    SELECT id, order_id, customer_name, value, platform, status, order_type, created_at
    FROM orders
    WHERE ($1::text IS NULL OR platform = $1)
      AND ($2::timestamptz IS NULL OR created_at >= $2)
      AND ($3::timestamptz IS NULL OR created_at < $3)
    ORDER BY created_at DESC
    LIMIT $4;
  `;

  const params = [platform || null, start, end, limit];
  const { rows } = await query(text, params);
  return rows;
}

async function getMetrics({ datePreset = "all" }) {
  const { start, end } = mapDateRange(datePreset);

  const text = `
    WITH filtered AS (
      SELECT *
      FROM orders
      WHERE ($1::timestamptz IS NULL OR created_at >= $1)
        AND ($2::timestamptz IS NULL OR created_at < $2)
    )
    SELECT
      COALESCE(SUM(value), 0) AS total_value,
      COUNT(*) AS total_orders,
      COALESCE(AVG(NULLIF(value, 0)), 0) AS average_ticket,
      COUNT(*) FILTER (WHERE order_type ILIKE '%kit%') AS kit_count,
      COALESCE(SUM(value) FILTER (WHERE order_type ILIKE '%kit%'), 0) AS kit_total,
      COUNT(*) FILTER (WHERE order_type ILIKE '%amostra%' OR order_type ILIKE '%sample%') AS sample_count,
      COALESCE(SUM(value) FILTER (WHERE order_type ILIKE '%amostra%' OR order_type ILIKE '%sample%'), 0) AS sample_total,
      COUNT(*) FILTER (WHERE order_type ILIKE '%callcenter%' OR order_type ILIKE '%call center%') AS callcenter_count,
      COALESCE(SUM(value) FILTER (WHERE order_type ILIKE '%callcenter%' OR order_type ILIKE '%call center%'), 0) AS callcenter_total
    FROM filtered;
  `;

  const params = [start, end];
  const { rows } = await query(text, params);
  return rows[0];
}

module.exports = {
  upsertOrder,
  listOrders,
  getMetrics,
};
