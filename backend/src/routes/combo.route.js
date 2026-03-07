const express = require("express");
const router = express.Router();
const { addCombo, getAllCombos, deleteCombo } = require("../controllers/combo.controller.js");
// getPricingRecommendations — computes data-driven price suggestions and
// discount thresholds for every product using BCG quadrant rules.
const { generateSmartCombos, getProductAnalytics, getAssociationRules, getSuggestions, getComboAnalytics, getPricingRecommendations } = require("../controllers/analytics.controller.js");

router.post("/add", addCombo);
router.get("/all", getAllCombos);
router.delete("/:id", deleteCombo);
router.get("/generate", generateSmartCombos);
router.get("/suggest/:productId", getSuggestions);
router.get("/analytics/combo/:comboId", getComboAnalytics);
router.get("/analytics/products", getProductAnalytics);
router.get("/analytics/associations", getAssociationRules);
// Pricing Intelligence endpoint — returns suggested prices, max discount %,
// min price, demand scores, and strategy text for every product.
router.get("/analytics/pricing", getPricingRecommendations);

module.exports = router;

