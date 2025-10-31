const express = require("express");
const { listOrders } = require("../models/orderModel");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { platform, range } = req.query;
    const orders = await listOrders({
      platform: platform || null,
      datePreset: range || "all",
      limit: Number(req.query.limit) || 200,
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
