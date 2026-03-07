const express = require("express");
const router = express.Router();
const { addProduct, deleteProduct, updateProduct, getAllProducts } = require("../controllers/product.controller.js");
// Import applyPricing from analytics controller — it handles saving
// the owner's chosen price, discount threshold, and min price to the product.
const { applyPricing } = require("../controllers/analytics.controller.js");

router.get("/all", getAllProducts);
router.post("/add", addProduct);
// IMPORTANT: /:id/pricing must be registered BEFORE /:id
// otherwise Express would match "someId/pricing" as an :id parameter
// and route to updateProduct instead of applyPricing.
router.put("/:id/pricing", applyPricing); // Apply pricing recommendation (price + discount threshold)
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
