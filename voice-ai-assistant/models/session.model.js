const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({

    session_id: {
        type: String,
        required: true
    },

    current_order: {
        type: Object,
        default: {}
    },

    last_upsell: {
        type: Object,
        default: null
    },

    pending_clarification: {
        type: Array,
        default: null
    },

    last_question: {
        type: String,
        default: null
    },

    status: {
        type: String,
        default: "ordering"
    }

}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);