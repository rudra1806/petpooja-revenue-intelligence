const Order = require("../models/order.model.js");

const addOrder = async (req, res) => {
    try {
        const { order_id, session_id, order_channel, items, combos, total_items, total_price, discount, final_price, order_score, rating } = req.body;

        if (!order_id || !order_channel || !total_items || !total_price || !final_price) {
            return res.status(400).json({ success: false, message: "order_id, order_channel, total_items, total_price and final_price are required" });
        }

        const existingOrder = await Order.findOne({ order_id });
        if (existingOrder) {
            return res.status(409).json({ success: false, message: "Order with this order_id already exists" });
        }

        const order = await Order.create({
            order_id,
            session_id,
            order_channel,
            items,
            combos,
            total_items,
            total_price,
            discount,
            final_price,
            order_score,
            rating,
        });

        return res.status(201).json({ success: true, message: "Order added successfully", data: order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const order = await Order.findOneAndUpdate(
            { order_id: id },
            { $set: updates },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, message: "Order updated successfully", data: order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findOneAndDelete({ order_id: id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getOrdersBySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const orders = await Order.find({ session_id: sessionId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addOrder, getAllOrders, updateOrder, deleteOrder, getOrdersBySession };
