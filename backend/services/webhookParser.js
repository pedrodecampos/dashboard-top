const inferOrderType = (payload) => {
  const candidates = [
    payload.order_type,
    payload.product_type,
    payload.type,
    payload.category,
    payload.segment,
    payload.offer_name,
    payload.product_name,
  ]
    .filter(Boolean)
    .map(String);

  if (candidates.length === 0 && Array.isArray(payload.items)) {
    candidates.push(
      payload.items
        .map((item) => item.name || item.sku || "")
        .filter(Boolean)
        .join(" ")
    );
  }

  const text = candidates.join(" ").toLowerCase();

  if (text.includes("kit")) return "Kit";
  if (text.includes("amostra")) return "Amostra";
  if (text.includes("call")) return "Callcenter";

  return candidates[0] || null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const sanitizeNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parseWebhookPayload = (payload = {}) => {
  const platform =
    payload.platform ||
    payload.provider ||
    payload.source ||
    payload.origin ||
    "unknown";

  const firstName =
    payload.first_name || payload.firstName || payload.customer_first_name;
  const lastName =
    payload.last_name || payload.lastName || payload.customer_last_name;

  const customer_name =
    payload.customer_name ||
    payload.name ||
    [firstName, lastName].filter(Boolean).join(" ");

  const order_id =
    payload.order_id ||
    payload.purchase_id ||
    payload.id ||
    payload.transaction_id;

  const status = (
    payload.status ||
    payload.payment_status ||
    payload.state ||
    "pending"
  )
    .toString()
    .toLowerCase();

  const value = sanitizeNumber(
    payload.value ||
      payload.amount ||
      payload.total ||
      payload.price ||
      payload.gross_amount
  );

  const order_type = inferOrderType(payload);

  const created_at =
    parseDate(
      payload.created_at ||
        payload.timestamp ||
        payload.date ||
        payload.approved_at
    ) || null;

  const normalized = {
    order_id,
    customer_name,
    value,
    platform,
    status,
    order_type,
    created_at,
    raw_payload: JSON.stringify(payload),
  };

  if (!normalized.order_id) {
    throw new Error("Payload inválido: order_id ausente");
  }

  return normalized;
};

module.exports = {
  parseWebhookPayload,
};
