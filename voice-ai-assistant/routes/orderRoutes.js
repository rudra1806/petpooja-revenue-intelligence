const express = require("express");
const router = express.Router();
const { parseOrder, getOrdersByUser } = require("../controllers/orderController");

router.post("/parse-order", parseOrder);
router.get("/order/user/:userId", getOrdersByUser);

module.exports = router;