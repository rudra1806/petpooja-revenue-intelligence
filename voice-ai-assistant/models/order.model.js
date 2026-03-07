const mongoose = require("mongoose");

const selectedModifierSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    value: {
        type: String,
    },
    extra_price: {
        type: Number,
        default: 0,
    }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
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
    },
    selected_modifiers: [selectedModifierSchema],
}, { _id: false });

const orderComboSchema = new mongoose.Schema({
    combo_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Combo",
    },
    combo_name: {
        type: String,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    combo_price: {
        type: Number,
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true,
    },
    session_id: {
        type: String,
        default: null,
    },
    order_channel: {
        type: String,
        required: true,
        enum: ["voice", "app", "counter"],
    },
    items: [orderItemSchema],
    combos: [orderComboSchema],
    total_items: {
        type: Number,
        required: true,
    },
    total_price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    final_price: {
        type: Number,
        required: true,
    },
    order_score: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

orderSchema.index({ "items.product_id": 1 });
orderSchema.index({ session_id: 1 });


module.exports = mongoose.model("Order", orderSchema);