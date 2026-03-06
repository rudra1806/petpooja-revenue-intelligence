const Combo = require("../models/combo.model.js");

const addCombo = async (req, res) => {
    try {
        const { combo_name, description, items, total_selling_price, combo_price, discount, total_cost, support, confidence, combo_score, rating } = req.body;

        if (!combo_name || !total_selling_price || !combo_price) {
            return res.status(400).json({ success: false, message: "combo_name, total_selling_price and combo_price are required" });
        }

        const combo = await Combo.create({
            combo_name,
            description: description || "",
            items,
            total_selling_price,
            combo_price,
            discount: discount || 0,
            total_cost: total_cost || 0,
            support: support || 0,
            confidence: confidence || 0,
            combo_score: combo_score || 0,
            rating: rating || 0,
        });

        return res.status(201).json({ success: true, message: "Combo added successfully", data: combo });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllCombos = async (req, res) => {
    try {
        const combos = await Combo.find().sort({ combo_score: -1 }).lean();
        return res.status(200).json({ success: true, total: combos.length, data: combos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await Combo.findByIdAndDelete(id);
        if (!combo) {
            return res.status(404).json({ success: false, message: "Combo not found" });
        }
        return res.status(200).json({ success: true, message: "Combo deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addCombo, getAllCombos, deleteCombo };

