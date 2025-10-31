const express = require("express");
const { upsertOrder } = require("../models/orderModel");
const { parseWebhookPayload } = require("../services/webhookParser");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
    if (sharedSecret) {
      const providedSecret =
        req.headers["x-shared-secret"] || req.headers["x-webhook-secret"];

      if (providedSecret !== sharedSecret) {
        return res.status(401).json({ error: "Assinatura inválida" });
      }
    }

    const normalizedOrder = parseWebhookPayload(req.body);
    const order = await upsertOrder(normalizedOrder);

    res.status(201).json({ ok: true, order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
