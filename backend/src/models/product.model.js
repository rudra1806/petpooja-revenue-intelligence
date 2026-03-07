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

    // ─── PRICING INTELLIGENCE FIELDS ─────────────────────────────────
    // These fields are populated when the owner applies a pricing recommendation
    // from the Pricing Dashboard. They start as null and get set via PUT /api/product/:id/pricing.

    // The analytics-recommended selling price based on BCG classification and demand data.
    // Computed by getPricingRecommendations() using quadrant-based price adjustment rules.
    suggested_price: {
        type: Number,
        default: null,
    },
    // Maximum discount percentage this product can safely sustain without
    // dropping below the minimum acceptable margin (20%). Used by the combo
    // generator to auto-cap combo discounts instead of using hardcoded values.
    max_discount_pct: {
        type: Number,
        default: null,
    },
    // Floor price — the absolute minimum selling price that maintains a 20% margin.
    // Calculated as: cost / (1 - 0.20). The owner should never price below this.
    min_price: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

productSchema.index({ category: 1 }); // this is used for efficient querying of products by category

module.exports = mongoose.model("Product", productSchema);
