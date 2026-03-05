const mongoose = require("mongoose");

const comboItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    name: {
        type: String,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    base_price: {
        type: Number,
    }
}, { _id: false });

const comboSchema = new mongoose.Schema({
    combo_name: {
        type: String,
        required: true,
    },
    items: [comboItemSchema],
    total_selling_price: {
        type: Number,
        required: true,
    },
    combo_price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    total_cost: {
        type: Number,
    },
    support: {
        type: Number,
        default: 0
    },

    confidence: {
        type: Number,
        default: 0
    },
    combo_score: {
        //combo_score = 0.4 × confidence + 0.3 × profit + 0.3 × demand 
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

comboSchema.index({ "items.product_id": 1 }); // this is used for efficient querying of combos by product_id
comboSchema.index({ combo_score: -1 }); // this is used for efficient querying of combos by combo_score in descending order

module.exports = mongoose.model("Combo", comboSchema);
