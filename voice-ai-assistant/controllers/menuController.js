const Product = require("../models/product.model");
const Combo = require("../models/combo.model");

// GET /api/product/all
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.json({ success: true, data: products });
    } catch (err) {
        console.error("getAllProducts error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// GET /api/combo/all
const getAllCombos = async (req, res) => {
    try {
        const combos = await Combo.find().lean();
        res.json({ success: true, data: combos });
    } catch (err) {
        console.error("getAllCombos error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

module.exports = { getAllProducts, getAllCombos };
