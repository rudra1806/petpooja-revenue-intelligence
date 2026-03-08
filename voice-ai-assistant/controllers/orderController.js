const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Combo = require("../models/combo.model");
const Order = require("../models/order.model");
const Session = require("../models/session.model");
const Fuse = require("fuse.js");
const { v4: uuidv4 } = require("uuid"); // npm i uuid
const jwt = require("jsonwebtoken");
const detectIntent = require("../utils/intentDetector");
const menuAssistantAI = require("../ai/menuAssistantAI");

/**
 * Optionally extract the authenticated user's id from the JWT cookie.
 * Returns null if no token or invalid — does NOT block the request.
 */
function getUserIdFromRequest(req) {
    try {
        const token = req.cookies && req.cookies.auth_token;
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id || null;
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const CONFIRM_WORDS = ["yes", "yeah", "ok", "okay", "sure", "yep"];
const REJECT_WORDS = ["no", "nope", "nah"];
const CONFIRM_ORDER_WORDS = ["confirm", "place order", "done", "finish", "that's all", "thats all"];
const DELETE_WORDS = ["remove", "delete", "cancel"];
const INCREASE_WORDS = [
    "increase",
    "more",
    "add more",
    "add one more",
    "another",
    "one more"
];
const SET_QTY_WORDS = ["make", "set"];
const REPLACE_WORDS = ["replace", "change", "swap", "modify", "modified"];
const SKIP_ADDON_WORDS = ["no", "nope", "nah", "skip", "none", "nothing", "no thanks", "that's it", "thats it"];

const FILLER_WORDS = [
    "give", "me", "can", "i", "get", "want",
    "please", "chahiye", "dena", "a", "an", "the",
    "would", "like", "to", "have", "order", "add"
];

const NUMBER_WORDS = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Merge newItems into existingItems.
 * Increments quantity if the same product already exists.
 */
function mergeIntoOrder(existingItems, newItems) {
    for (const newItem of newItems) {
        const existing = existingItems.find(
            i => i.product_id.toString() === newItem.product_id.toString()
        );
        if (existing) {
            existing.quantity += newItem.quantity;
        } else {
            existingItems.push(newItem);
        }
    }
}

/**
 * Merge a combo into the combos array.
 * Increments quantity if the same combo already exists.
 */
function mergeComboIntoOrder(existingCombos, newCombo) {
    const existing = existingCombos.find(
        c => c.combo_id.toString() === newCombo.combo_id.toString()
    );
    if (existing) {
        existing.quantity += newCombo.quantity;
    } else {
        existingCombos.push(newCombo);
    }
}

/**
 * Human-readable order summary: "2x Burger, 1x Fries, 1x Burger Combo (combo)"
 */
function orderSummary(order) {
    const itemParts = (order.items || []).map(i => {
        const mods = (i.selected_modifiers || []).filter(m => m.extra_price > 0);
        const modStr = mods.length ? ` (${mods.map(m => `${m.name}: ${m.value}`).join(", ")})` : "";
        return `${i.quantity}x ${i.name}${modStr}`;
    });
    const comboParts = (order.combos || []).map(c => `${c.quantity}x ${c.combo_name} (combo)`);
    const all = [...itemParts, ...comboParts];
    return all.length ? all.join(", ") : "nothing yet";
}

/**
 * Calculate order totals matching the Order schema fields.
 */
function calculateTotals(order) {
    const totalPrice = [
        ...(order.items || []).map(i => {
            const modExtra = (i.selected_modifiers || []).reduce((sum, m) => sum + (m.extra_price || 0), 0);
            return (i.base_price + modExtra) * i.quantity;
        }),
        ...(order.combos || []).map(c => c.combo_price * c.quantity)
    ].reduce((s, v) => s + v, 0);

    const totalItems = [
        ...(order.items || []).map(i => i.quantity),
        ...(order.combos || []).map(c => c.quantity)
    ].reduce((s, v) => s + v, 0);

    return { totalItems, totalPrice, finalPrice: totalPrice };
}

/**
 * Extract quantity + product search text from a raw phrase.
 * "two burgers with cheese" → { quantity: 2, productText: "burger" }
 */
function extractQuantityAndText(raw) {
    let part = raw.trim();
    let quantity = 1;

    // Detect if the number is likely a price or negotiation rather than quantity
    // e.g. "burger for 100" -> 100 is price, not quantity.
    const priceContextMatch = part.match(/\b(for|at|rs|rupees|bucks|price|cost)\b\s*(\d+)/i);
    if (priceContextMatch) {
        // Remove the price context so it's not picked up as quantity
        part = part.replace(priceContextMatch[0], "");
    }

    const digitMatch = part.match(/\b(\d+)\b/);
    if (digitMatch) {
        quantity = parseInt(digitMatch[1], 10);
        part = part.replace(digitMatch[0], "");
    }

    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
        const re = new RegExp(`\\b${word}\\b`, "i");
        if (re.test(part)) {
            quantity = val;
            part = part.replace(re, "");
        }
    }

    let productText = part
        .replace(/\bwith\b/gi, "")
        .replace(/\bwithout\b/gi, "")
        .replace(/\bno\b/gi, "")
        .trim();

    // Naive de-pluralise: "burgers" → "burger"
    if (productText.endsWith("s") && productText.length > 3) {
        productText = productText.slice(0, -1);
    }

    return { quantity, productText };
}

/**
 * Build a human-readable add-on prompt for a product's modifiers.
 */
function formatAddonPrompt(productName, modifiers) {
    const parts = modifiers
        .filter(mod => mod.options.some(opt => opt.extra_price > 0))
        .map(mod => {
            const optStrs = mod.options.map(opt => {
                const label = opt.value.replace(/_/g, " ");
                return opt.extra_price > 0 ? `${label} (+₹${opt.extra_price})` : label;
            });
            return `${mod.name.replace(/_/g, " ")}: ${optStrs.join(", ")}`;
        });
    if (!parts.length) return null;
    return `🛎 Would you like to customize your ${productName}? Options: ${parts.join("; ")}. Say what you'd like or "skip" to keep it as is.`;
}

/**
 * Parse user text to extract selected modifier options.
 */
function parseAddonSelections(text, modifiers) {
    const selected = [];
    for (const mod of modifiers) {
        for (const opt of mod.options) {
            const optValue = opt.value.toLowerCase().replace(/_/g, " ");
            if (text.includes(optValue)) {
                selected.push({
                    name: mod.name,
                    value: opt.value,
                    extra_price: opt.extra_price
                });
                break; // one selection per modifier
            }
        }
    }
    return selected;
}

// ─────────────────────────────────────────────
// MAIN CONTROLLER
// ─────────────────────────────────────────────

exports.parseOrder = async (req, res) => {
    try {
        let { text, sessionId } = req.body;

        if (!text) return res.status(400).json({ message: "Text missing." });
        if (!sessionId) return res.status(400).json({ message: "sessionId missing." });

        text = text.toLowerCase().trim();
        console.log(`🎤 [${sessionId}] User said: "${text}"`);

        // ── Load or create session ──────────────────────────────────────────
        let session = await Session.findOne({ session_id: sessionId });

        if (!session) {
            session = await Session.create({
                session_id: sessionId,
                current_order: { items: [], combos: [] },
                last_upsell: null,
                pending_clarification: null,
                pending_addon: null,
                last_question: null,   // reused to store pending quantity during clarification
                status: "ordering"
            });
        }

        // Back-compat: ensure combos array always present
        if (!session.current_order.combos) {
            session.current_order.combos = [];
            session.markModified("current_order");
        }

        // ── Detect Intent ───────────────────────────────────────────────────
        const intent = await detectIntent(text);
        console.log(`🎯 [${sessionId}] Detected Intent: ${intent}`);

        if (intent === "NEGOTIATION") {
            return res.json({
                message: "Sorry, our prices are fixed as per the menu. We don't support negotiation, but I can help you find something within your budget!",
                ai: true
            });
        }

        if (intent === "GREETING") {
            const aiResponse = await menuAssistantAI(text, await Product.find(), await Combo.find());
            return res.json({
                message: aiResponse,
                ai: true
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 1. ORDER CONFIRMATION  (highest priority)
        // ════════════════════════════════════════════════════════════════════
        if (CONFIRM_ORDER_WORDS.some(w => text.includes(w))) {
            const hasItems = session.current_order.items?.length > 0;
            const hasCombos = session.current_order.combos?.length > 0;

            if (!hasItems && !hasCombos) {
                return res.json({ message: "Your order is empty! What would you like to order?" });
            }

            const finalOrder = JSON.parse(JSON.stringify(session.current_order));
            const { totalItems, totalPrice, finalPrice } = calculateTotals(finalOrder);

            // Resolve authenticated user (if logged in)
            const userId = getUserIdFromRequest(req);

            // Persist to Order collection — matches orderSchema exactly
            const savedOrder = await Order.create({
                order_id: uuidv4(),
                user_id: userId,          // links order to the logged-in user
                session_id: sessionId,    // keep for backwards compat
                order_channel: "voice",
                items: finalOrder.items.map(i => ({
                    product_id: i.product_id,
                    name: i.name,
                    quantity: i.quantity,
                    base_price: i.base_price,
                    selected_modifiers: i.selected_modifiers || []
                })),
                combos: (finalOrder.combos || []).map(c => ({
                    combo_id: c.combo_id,
                    combo_name: c.combo_name,
                    quantity: c.quantity,
                    combo_price: c.combo_price
                })),
                total_items: totalItems,
                total_price: totalPrice,
                discount: 0,
                final_price: finalPrice,
                order_score: 0,
                rating: 0
            });

            // Full session reset
            session.current_order = { items: [], combos: [] };
            session.last_upsell = null;
            session.pending_clarification = null;
            session.pending_addon = null;
            session.last_question = null;
            session.status = "ordering";
            session.markModified("current_order");
            await session.save();

            return res.json({
                message: `🎉 Order confirmed! PETPOOJA was happpy to serve you. You ordered: ${orderSummary(finalOrder)}. Total: ₹${finalPrice}.`,
                order: finalOrder,
                order_id: savedOrder.order_id,
                total: finalPrice,
                completed: true
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 2. UPSELL RESPONSE  (yes / no to a combo suggestion)
        // ════════════════════════════════════════════════════════════════════
        if (session.last_upsell) {
            if (CONFIRM_WORDS.some(w => text.includes(w))) {
                const u = session.last_upsell;

                mergeComboIntoOrder(session.current_order.combos, {
                    combo_id: u.combo_id,
                    combo_name: u.combo_name,
                    quantity: 1,
                    combo_price: u.combo_price
                });

                session.last_upsell = null;
                session.markModified("current_order");
                await session.save();

                return res.json({
                    message: `✅ Added "${u.combo_name}" combo! Anything else, or say "confirm" to place your order?`,
                    order: session.current_order
                });
            }

            if (REJECT_WORDS.some(w => text.includes(w))) {
                session.last_upsell = null;
                await session.save();

                return res.json({
                    message: `No problem! Anything else, or say "confirm" to place your order?`,
                    order: session.current_order
                });
            }

            // Unrelated input — dismiss upsell silently and fall through
            session.last_upsell = null;
            await session.save();
        }

        // ════════════════════════════════════════════════════════════════════
        // 2b. ADD-ON / CUSTOMIZATION RESPONSE
        // ════════════════════════════════════════════════════════════════════
        if (session.pending_addon) {
            const addon = session.pending_addon;
            const itemIdx = session.current_order.items.findIndex(
                i => i.product_id.toString() === addon.product_id.toString()
            );

            if (itemIdx !== -1) {
                // User wants to skip add-ons
                if (SKIP_ADDON_WORDS.some(w => text.includes(w))) {
                    session.pending_addon = null;
                    await session.save();

                    return res.json({
                        message: `No customizations added. Order so far: ${orderSummary(session.current_order)}. Anything else, or say "confirm" to place your order?`,
                        order: session.current_order
                    });
                }

                // Parse which modifiers the user selected
                const selections = parseAddonSelections(text, addon.modifiers);

                if (selections.length) {
                    // Apply selected modifiers to the item
                    session.current_order.items[itemIdx].selected_modifiers = selections;
                    session.pending_addon = null;
                    session.markModified("current_order");
                    await session.save();

                    const modDesc = selections
                        .filter(s => s.extra_price > 0)
                        .map(s => `${s.name.replace(/_/g, " ")}: ${s.value.replace(/_/g, " ")} (+₹${s.extra_price})`)
                        .join(", ");
                    const modMsg = modDesc ? ` with ${modDesc}` : "";

                    return res.json({
                        message: `✅ Customized ${addon.product_name}${modMsg}. Order so far: ${orderSummary(session.current_order)}. Anything else?`,
                        order: session.current_order
                    });
                }

                // Couldn't parse — re-prompt
                const prompt = formatAddonPrompt(addon.product_name, addon.modifiers);
                return res.json({
                    message: `I didn't catch that. ${prompt || 'Say "skip" to continue without customization.'}`
                });
            }

            // Item no longer in order — clear addon state
            session.pending_addon = null;
            await session.save();
        }

        // ── Handle bare "no" / "nope" when no upsell is pending ─────────────
        if (REJECT_WORDS.some(w => text === w)) {
            return res.json({
                message: `Alright! Your order so far: ${orderSummary(session.current_order)}. Anything else, or say "confirm" to place your order?`,
                order: session.current_order
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 3. CLARIFICATION RESPONSE  (user resolving an ambiguous product)
        // ════════════════════════════════════════════════════════════════════
        if (session.pending_clarification) {
            const options = session.pending_clarification;
            let chosen = null;

            // a) Numeric pick: "1", "2", "3"
            const numMatch = text.match(/\b([123])\b/);
            if (numMatch) {
                const idx = parseInt(numMatch[1], 10) - 1;
                if (options[idx]) chosen = options[idx];
            }

            // b) Direct / substring name match
            if (!chosen) {
                for (const option of options) {
                    if (
                        text.includes(option.name.toLowerCase()) ||
                        option.name.toLowerCase().includes(text)
                    ) {
                        chosen = option;
                        break;
                    }
                }
            }

            // c) Fuzzy fallback
            if (!chosen) {
                const clarFuse = new Fuse(options, { keys: ["name"], threshold: 0.5 });
                const match = clarFuse.search(text);
                if (match.length) chosen = match[0].item;
            }

            // Still unclear — re-prompt
            if (!chosen) {
                return res.json({
                    clarification: `Please choose one:\n${options.map((o, i) => `${i + 1}. ${o.name} — ₹${o.base_price}`).join("\n")}`
                });
            }

            // Extract quantity from clarification response text (e.g. "I want three classic burger")
            const { quantity: parsedQty } = extractQuantityAndText(text);
            // Use quantity from response if explicitly stated, otherwise fall back to stored quantity
            const storedQty = parseInt(session.last_question) || 1;
            const qty = parsedQty > 1 ? parsedQty : storedQty;

            session.pending_clarification = null;
            session.last_question = null;

            mergeIntoOrder(session.current_order.items, [{
                product_id: chosen.product_id,
                name: chosen.name,
                quantity: qty,
                base_price: chosen.base_price,
                selected_modifiers: []
            }]);

            session.markModified("current_order");

            // Check if product has paid add-ons/modifiers
            const chosenProduct = await Product.findById(chosen.product_id);
            if (chosenProduct && chosenProduct.modifiers && chosenProduct.modifiers.length) {
                const addonPrompt = formatAddonPrompt(chosen.name, chosenProduct.modifiers);
                if (addonPrompt) {
                    session.pending_addon = {
                        product_id: chosen.product_id,
                        product_name: chosen.name,
                        modifiers: chosenProduct.modifiers
                    };
                    await session.save();

                    return res.json({
                        message: `✅ Added ${qty}x ${chosen.name}. ${addonPrompt}`,
                        order: session.current_order
                    });
                }
            }

            // Combo upsell for the resolved item
            const combo = await Combo.findOne({ "items.product_id": chosen.product_id })
                .sort({ combo_score: -1 });

            let upsell = null;
            if (combo) {
                upsell = `🍱 How about our "${combo.combo_name}" combo for ₹${combo.combo_price}? Great value!`;
                session.last_upsell = {
                    combo_id: combo._id,
                    combo_name: combo.combo_name,
                    combo_price: combo.combo_price
                };
            }

            await session.save();

            return res.json({
                message: `✅ Added ${qty}x ${chosen.name}. Order so far: ${orderSummary(session.current_order)}. Anything else?`,
                order: session.current_order,
                upsell
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // DELETE OR REDUCE ITEM FROM ORDER
        // ════════════════════════════════════════════════════════════════════

        if (DELETE_WORDS.some(w => text.includes(w))) {
            console.log("🗑 Delete intent detected:", text);

            const orderItems = session.current_order.items;

            if (!orderItems.length) {
                return res.json({
                    message: "Your order is empty."
                });
            }

            const fuse = new Fuse(orderItems, {
                keys: ["name"],
                threshold: 0.4
            });

            const cleaned = text
                .replace(/remove|delete|cancel/gi, "")
                .replace(/\bone\b|\btwo\b|\bthree\b|\bfour\b|\bfive\b/gi, "")
                .replace(/\d+/g, "")
                .trim();

            console.log("Searching item:", cleaned);

            const result = fuse.search(cleaned);

            console.log("Fuse result:", result);

            if (!result.length) {
                return res.json({
                    message: "I couldn't find that item in your order."
                });
            }

            const item = result[0].item;

            let removeQty = 1;

            const digitMatch = text.match(/\b(\d+)\b/);
            if (digitMatch) removeQty = parseInt(digitMatch[1]);

            for (const [word, num] of Object.entries(NUMBER_WORDS)) {
                if (text.includes(word)) removeQty = num;
            }

            if (item.quantity > removeQty) {
                item.quantity -= removeQty;

                session.markModified("current_order");
                await session.save();

                return res.json({
                    message: `Removed ${removeQty} ${item.name}. Order now: ${orderSummary(session.current_order)}.`,
                    order: session.current_order
                });
            }

            const index = session.current_order.items.findIndex(
                i => i.product_id.toString() === item.product_id.toString()
            );

            session.current_order.items.splice(index, 1);

            session.markModified("current_order");
            await session.save();

            return res.json({
                message: `Removed ${item.name}. Order now: ${orderSummary(session.current_order)}.`,
                order: session.current_order
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // UPDATE ITEM QUANTITY
        // ════════════════════════════════════════════════════════════════════

        if (
            INCREASE_WORDS.some(w => text.includes(w)) ||
            SET_QTY_WORDS.some(w => text.includes(w))
        ) {
            console.log("🔧 Quantity update detected:", text);

            const orderItems = session.current_order.items;

            if (!orderItems.length) {
                return res.json({
                    message: "Your order is empty."
                });
            }

            const fuse = new Fuse(orderItems, {
                keys: ["name"],
                threshold: 0.4
            });

            const cleaned = text
                .replace(/increase|add more|one more|another|more|make|set|change/gi, "")
                .replace(/\b\d+\b/g, "")
                .trim();

            console.log("Searching order item:", cleaned);

            const result = fuse.search(cleaned);

            console.log("Fuse match:", result);

            if (!result.length) {
                return res.json({
                    message: "I couldn't find that item in your order."
                });
            }

            const item = result[0].item;

            let qty = null;

            const digitMatch = text.match(/\b(\d+)\b/);

            if (digitMatch) {
                qty = parseInt(digitMatch[1]);
            }

            for (const [word, num] of Object.entries(NUMBER_WORDS)) {
                if (text.includes(word)) {
                    qty = num;
                }
            }

            // INCREASE QUANTITY
            if (INCREASE_WORDS.some(w => text.includes(w))) {
                const increaseBy = qty ? qty : 1;
                item.quantity += increaseBy;
            }

            // SET QUANTITY
            if (SET_QTY_WORDS.some(w => text.includes(w))) {
                if (qty) {
                    item.quantity = qty;
                } else {
                    return res.json({
                        message: "Please tell me the quantity."
                    });
                }
            }

            session.markModified("current_order");
            await session.save();

            return res.json({
                message: `Updated ${item.name} quantity to ${item.quantity}. Order now: ${orderSummary(session.current_order)}.`,
                order: session.current_order
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // REPLACE ITEM IN ORDER
        // ════════════════════════════════════════════════════════════════════

        if (REPLACE_WORDS.some(w => text.includes(w))) {
            console.log("🔁 Replace intent detected:", text);

            const parts = text.split(/to|with/);

            if (parts.length < 2) {
                return res.json({
                    message: "What would you like to replace it with?"
                });
            }

            // CLEAN OLD ITEM TEXT
            const oldItemText = parts[0]
                .replace(/replace|change|swap/gi, "")
                .trim();

            // CLEAN NEW ITEM TEXT
            const newItemText = parts[1].trim();

            console.log("Old item search:", oldItemText);
            console.log("New item search:", newItemText);

            const orderItems = session.current_order.items;

            if (!orderItems.length) {
                return res.json({
                    message: "Your order is empty."
                });
            }

            // FIND OLD ITEM IN ORDER
            const fuseOrder = new Fuse(orderItems, {
                keys: ["name"],
                threshold: 0.4
            });

            const oldMatch = fuseOrder.search(oldItemText);

            console.log("Old item match:", oldMatch);

            if (!oldMatch.length) {
                return res.json({
                    message: "I couldn't find that item in your order."
                });
            }

            const oldItem = oldMatch[0].item;

            // FIND NEW PRODUCT IN MENU
            const products = await Product.find();

            const fuseProducts = new Fuse(products, {
                keys: ["name"],
                threshold: 0.4
            });

            const newMatch = fuseProducts.search(newItemText);

            console.log("New item match:", newMatch);

            if (!newMatch.length) {
                return res.json({
                    message: "I couldn't find that item on the menu."
                });
            }

            const newProduct = newMatch[0].item;

            // REMOVE OLD ITEM
            const index = session.current_order.items.findIndex(
                i => i.product_id.toString() === oldItem.product_id.toString()
            );

            const qty = oldItem.quantity;

            session.current_order.items.splice(index, 1);

            // add new item using merge helper
            mergeIntoOrder(session.current_order.items, [{
                product_id: newProduct._id,
                name: newProduct.name,
                quantity: qty,
                base_price: newProduct.selling_price,
                selected_modifiers: []
            }]);

            session.markModified("current_order");
            await session.save();

            return res.json({
                message: `Replaced ${oldItem.name} with ${newProduct.name}. Order now: ${orderSummary(session.current_order)}.`,
                order: session.current_order
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 5. PARSE NEW ORDER TEXT
        // ════════════════════════════════════════════════════════════════════

        // Remove filler words
        const cleanedText = text
            .split(" ")
            .filter(w => !FILLER_WORDS.includes(w))
            .join(" ");

        // Split multi-item input: "burger and fries, coke"
        const parts = cleanedText.split(/\band\b|,/).map(p => p.trim()).filter(Boolean);

        const products = await Product.find();
        const allCombos = await Combo.find();

        if (!products.length && !allCombos.length) {
            return res.json({ clarification: "Sorry, the menu is currently empty." });
        }

        const fuse = new Fuse(products, {
            keys: ["name"],
            threshold: 0.45,
            includeScore: true
        });

        const comboFuse = new Fuse(allCombos, {
            keys: ["combo_name"],
            threshold: 0.45,
            includeScore: true
        });

        const parsedItems = [];
        const parsedCombos = [];

        for (const raw of parts) {
            const { quantity, productText } = extractQuantityAndText(raw);
            if (!productText) continue;

            // Search products first
            const rawResults = fuse.search(productText, { limit: 5 });
            const results = rawResults.filter(r => r.score !== undefined && r.score <= 0.45);

            // If product matches found, use them
            if (results.length) {
                // Ambiguity detection
                const topScore = results[0].score ?? 1;
                const secondScore = results[1]?.score ?? 1;
                const ambiguous = results.length > 1 && (secondScore - topScore) < 0.15;

                if (ambiguous) {
                    const options = results.slice(0, 3).map(r => ({
                        product_id: r.item._id,
                        name: r.item.name,
                        base_price: r.item.selling_price
                    }));

                    // Store quantity in last_question
                    session.pending_clarification = options;
                    session.last_question = String(quantity);
                    await session.save();

                    return res.json({
                        clarification: `We have a few options for "${productText}":\n${options.map((o, i) => `${i + 1}. ${o.name} — ₹${o.base_price}`).join("\n")}\nWhich one would you like?`
                    });
                }

                // Clear winner
                const product = results[0].item;
                parsedItems.push({
                    product_id: product._id,
                    name: product.name,
                    quantity,
                    base_price: product.selling_price,
                    selected_modifiers: []
                });
                continue;
            }

            // No product match — try combos only if user said "combo"
            if (text.includes("combo")) {
                const comboResults = comboFuse.search(productText, { limit: 3 })
                    .filter(r => r.score !== undefined && r.score <= 0.45);

                if (comboResults.length) {
                    const bestCombo = comboResults[0].item;
                    parsedCombos.push({
                        combo_id: bestCombo._id,
                        combo_name: bestCombo.combo_name,
                        quantity,
                        combo_price: bestCombo.combo_price
                    });
                    continue;
                }
            }
        }
        // ════════════════════════════════════════════════════════════
        // AI MENU QUESTION HANDLING
        // ════════════════════════════════════════════════════════════

        if (intent === "QUESTION") {

            console.log("🤖 AI menu question detected:", text);

            const aiResponse = await menuAssistantAI(
                text,
                products,
                allCombos
            );
            console.log("🤖 AI response:", aiResponse);
            return res.json({
                message: aiResponse,
                ai: true
            });
        }
        // ── Nothing matched — let AI handle greetings / general chat ──────
        if (!parsedItems.length && !parsedCombos.length) {
            const aiResponse = await menuAssistantAI(text, products, allCombos);
            return res.json({
                message: aiResponse,
                ai: true
            });
        }

        // ── Merge items into running order ───────────────────────────────────
        mergeIntoOrder(session.current_order.items, parsedItems);
        for (const pc of parsedCombos) {
            mergeComboIntoOrder(session.current_order.combos, pc);
        }
        session.markModified("current_order");

        // ── Check for add-ons/customizations on the first added product ────
        if (parsedItems.length) {
            const firstItem = parsedItems[0];
            const fullProduct = products.find(p => p._id.toString() === firstItem.product_id.toString());

            if (fullProduct && fullProduct.modifiers && fullProduct.modifiers.length) {
                const addonPrompt = formatAddonPrompt(firstItem.name, fullProduct.modifiers);
                if (addonPrompt) {
                    session.pending_addon = {
                        product_id: firstItem.product_id,
                        product_name: firstItem.name,
                        modifiers: fullProduct.modifiers
                    };
                    await session.save();

                    const addedItemNames = parsedItems.map(i => `${i.quantity}x ${i.name}`);
                    const addedComboNames = parsedCombos.map(c => `${c.quantity}x ${c.combo_name} (combo)`);
                    const addedNames = [...addedItemNames, ...addedComboNames].join(", ");

                    return res.json({
                        message: `✅ Added ${addedNames}. ${addonPrompt}`,
                        order: session.current_order
                    });
                }
            }
        }

        // ── Combo upsell (only if items were added, not combos) ────────────
        let upsell = null;
        if (parsedItems.length) {
            const combo = await Combo.findOne({ "items.product_id": parsedItems[0].product_id })
                .sort({ combo_score: -1 });

            if (combo) {
                upsell = `🍱 How about our "${combo.combo_name}" combo for ₹${combo.combo_price}? Great value!`;
                session.last_upsell = {
                    combo_id: combo._id,
                    combo_name: combo.combo_name,
                    combo_price: combo.combo_price
                };
            }
        }

        await session.save();

        const addedItemNames = parsedItems.map(i => `${i.quantity}x ${i.name}`);
        const addedComboNames = parsedCombos.map(c => `${c.quantity}x ${c.combo_name} (combo)`);
        const addedNames = [...addedItemNames, ...addedComboNames].join(", ");

        return res.json({
            message: `✅ Added ${addedNames}. Order so far: ${orderSummary(session.current_order)}. Anything else?`,
            order: session.current_order,
            upsell
        });

    } catch (error) {
        console.error("❌ parseOrder error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDERS BY USER (for My Orders page)
// ─────────────────────────────────────────────────────────────────────────────

exports.getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.json({ success: true, data: [] });
        }
        const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 });
        return res.json({ success: true, data: orders });
    } catch (error) {
        console.error("❌ getOrdersByUser error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};