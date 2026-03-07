const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
    value: {
        type: String,
    },
    extra_price: {
        type: Number,
        default: 0,
    }
}, { _id: false });

const modifierSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    options: [optionSchema],
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ["main", "snack", "dessert", "beverages"],
    },
    selling_price: {
        type: Number,
        required: true,
        min: 0
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
    },
    recommendation_score: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    modifiers: [modifierSchema],
    suggested_price: {
        type: Number,
        default: null,
    },
    max_discount_pct: {
        type: Number,
        default: null,
    },
    min_price: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

productSchema.index({ category: 1 }); // this is used for efficient querying of products by category

module.exports = mongoose.model("Product", productSchema);
