const express = require("express");
const router = express.Router();
const { addCombo, getAllCombos, deleteCombo } = require("../controllers/combo.controller.js");
const { generateSmartCombos, getProductAnalytics, getAssociationRules, getSuggestions } = require("../controllers/analytics.controller.js");

router.post("/add", addCombo);
router.get("/all", getAllCombos);
router.delete("/:id", deleteCombo);
router.get("/generate", generateSmartCombos);
router.get("/suggest/:productId", getSuggestions);
router.get("/analytics/products", getProductAnalytics);
router.get("/analytics/associations", getAssociationRules);

module.exports = router;

