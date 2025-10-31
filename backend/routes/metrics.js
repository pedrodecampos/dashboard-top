const express = require("express");
const { getMetrics } = require("../models/orderModel");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { range } = req.query;
    const metrics = await getMetrics({ datePreset: range || "all" });

    res.json({
      total_value: Number(metrics.total_value || 0),
      total_orders: Number(metrics.total_orders || 0),
      average_ticket: Number(metrics.average_ticket || 0),
      segments: {
        kit: {
          count: Number(metrics.kit_count || 0),
          total_value: Number(metrics.kit_total || 0),
        },
        sample: {
          count: Number(metrics.sample_count || 0),
          total_value: Number(metrics.sample_total || 0),
        },
        callcenter: {
          count: Number(metrics.callcenter_count || 0),
          total_value: Number(metrics.callcenter_total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
