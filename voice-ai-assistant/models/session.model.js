const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        session_id: { type: String, required: true, unique: true },

        current_order: {
            items: [
                {
                    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                    name: String,
                    quantity: { type: Number, default: 1 },
                    base_price: Number,
                    selected_modifiers: [{ type: String }]
                }
            ],
            combos: [
                {
                    combo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Combo" },
                    combo_name: String,
                    quantity: { type: Number, default: 1 },
                    combo_price: Number
                }
            ]
        },

        last_upsell: { type: mongoose.Schema.Types.Mixed, default: null },
        pending_clarification: { type: mongoose.Schema.Types.Mixed, default: null },
        last_question: { type: String, default: null },
        status: { type: String, default: "ordering" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);