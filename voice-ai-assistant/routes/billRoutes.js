const express = require("express");
const router = express.Router();
const Order = require("../models/order.model");

// GET /api/bill/:orderId — fetch a single order as bill data
router.get("/bill/:orderId", async (req, res) => {
    try {
        const order = await Order.findOne({ order_id: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        return res.json({ success: true, data: order });
    } catch (err) {
        console.error("Bill fetch error:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
