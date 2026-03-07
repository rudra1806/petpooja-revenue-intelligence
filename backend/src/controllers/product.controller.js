const Product = require("../models/product.model.js");

const addProduct = async (req, res) => {
    try {
        const { name, category, selling_price, cost, description, score, rating, isThereInCombo, modifiers } = req.body;

        if (!name || !category || !selling_price || !cost) {
            return res.status(400).json({ success: false, message: "name, category, selling_price and cost are required" });
        }

        const product = await Product.create({
            name,
            category,
            selling_price,
            cost,
            description,
            score,
            rating,
            isThereInCombo,
            modifiers,
        });

        return res.status(201).json({ success: true, message: "Product added successfully", data: product });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.status(200).json({ success: true, message: "Product updated successfully", data: product });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ category: 1, name: 1 });
        return res.status(200).json({ success: true, data: products });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addProduct, deleteProduct, updateProduct, getAllProducts };
