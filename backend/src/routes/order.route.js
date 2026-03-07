const express = require("express");
const router = express.Router();
const { addOrder, getAllOrders, updateOrder, deleteOrder, getOrdersBySession } = require("../controllers/order.controller.js");

router.get("/", getAllOrders);
router.get("/session/:sessionId", getOrdersBySession);
router.post("/add", addOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

module.exports = router;
