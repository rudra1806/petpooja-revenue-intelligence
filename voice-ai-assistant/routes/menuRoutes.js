const express = require("express");
const router = express.Router();
const { getAllProducts, getAllCombos } = require("../controllers/menuController");

router.get("/product/all", getAllProducts);
router.get("/combo/all", getAllCombos);

module.exports = router;
