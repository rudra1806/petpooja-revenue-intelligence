const Product = require("../models/product.model");
const Combo = require("../models/combo.model");
const Order = require("../models/order.model");
const Session = require("../models/session.model");
const Fuse = require("fuse.js");
const parseOrderWithAI = require("../services/aiParserService");
const { v4: uuidv4 } = require("uuid");
const menuAssistantAI = require("../ai/menuAssistantAI");
const isQuestion = require("../utils/isQuestion");

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
const REPLACE_WORDS = ["replace", "change", "swap"];

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
    const itemParts = (order.items || []).map(i => `${i.quantity}x ${i.name}`);
    const comboParts = (order.combos || []).map(c => `${c.quantity}x ${c.combo_name} (combo)`);
    const all = [...itemParts, ...comboParts];
    return all.length ? all.join(", ") : "nothing yet";
}

/**
 * Calculate order totals matching the Order schema fields.
 */
function calculateTotals(order) {
    const totalPrice = [
        ...(order.items || []).map(i => i.base_price * i.quantity),
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
                last_question: null,
                status: "ordering"
            });
        }

        // Back-compat: ensure combos array always present
        if (!session.current_order.combos) {
            session.current_order.combos = [];
            session.markModified("current_order");
        }

        // ════════════════════════════════════════════════════════════
        // AI MENU QUESTION HANDLING
        // ════════════════════════════════════════════════════════════

        if (isQuestion(text)) {
            console.log("🤖 AI menu question detected:", text);

            const products = await Product.find();
            const combos = await Combo.find();

            const aiResponse = await menuAssistantAI(text, products, combos);
            console.log("🤖 AI response:", aiResponse);
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

            // Persist to Order collection
            const savedOrder = await Order.create({
                order_id: uuidv4(),
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
            session.last_question = null;
            session.status = "ordering";
            session.markModified("current_order");
            await session.save();

            return res.json({
                message: `🎉 Order confirmed! You ordered: ${orderSummary(finalOrder)}. Total: ₹${finalPrice}.`,
                order: finalOrder,
                order_id: savedOrder.order_id,
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

            // Retrieve stored quantity
            const qty = parseInt(session.last_question) || 1;

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

            // Combo upsell for the resolved item
            const combo = await Combo.findOne({ "items.product_id": chosen.product_id })
                .sort({ combo_score: -1 });

            let replyMsg = `✅ Added ${qty}x ${chosen.name}. Order so far: ${orderSummary(session.current_order)}.`;
            let upsellPending = false;

            if (combo) {
                replyMsg += ` 🍱 How about our "${combo.combo_name}" combo for ₹${combo.combo_price}? Great value! Say yes or no.`;
                session.last_upsell = {
                    combo_id: combo._id,
                    combo_name: combo.combo_name,
                    combo_price: combo.combo_price
                };
                upsellPending = true;
            } else {
                replyMsg += " Anything else, or say confirm to place your order?";
            }

            await session.save();

            return res.json({
                message: replyMsg,
                order: session.current_order,
                upsellPending
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 4. DELETE OR REDUCE ITEM FROM ORDER
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
        // 5. UPDATE ITEM QUANTITY
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
        // 6. REPLACE ITEM IN ORDER
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
        // 7. PARSE NEW ORDER TEXT
        // ════════════════════════════════════════════════════════════════════

        // Load products from DB
        const products = await Product.find();
        if (!products.length) {
            return res.json({ clarification: "Sorry, the menu is currently empty." });
        }

        // -----------------------------------------------------
        // 🔹 TRY AI PARSING FIRST (LM Studio)
        // -----------------------------------------------------
        const aiParsed = await parseOrderWithAI(text, products);

        if (aiParsed && aiParsed.items && aiParsed.items.length > 0) {
            const items = aiParsed.items.map(aiItem => {
                const matched = products.find(p => p.name.toLowerCase() === aiItem.name.toLowerCase());
                if (matched) {
                    return {
                        product_id: matched._id,
                        name: matched.name,
                        quantity: aiItem.quantity || 1,
                        base_price: matched.selling_price,
                        selected_modifiers: (aiItem.modifiers || []).map(m => ({ name: m, price: 0 }))
                    };
                }
                return null;
            }).filter(Boolean);

            if (items.length > 0) {
                mergeIntoOrder(session.current_order.items, items);
                session.markModified("current_order");

                const combo = await Combo.findOne({ "items.product_id": items[0].product_id }).sort({ combo_score: -1 });
                const addedNames = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
                let replyMsg = `✅ Added ${addedNames}. Order so far: ${orderSummary(session.current_order)}.`;
                let upsellPending = false;

                if (combo) {
                    replyMsg += ` 🍱 How about our "${combo.combo_name}" combo for ₹${combo.combo_price}? Great value! Say yes or no.`;
                    session.last_upsell = {
                        combo_id: combo._id,
                        combo_name: combo.combo_name,
                        combo_price: combo.combo_price
                    };
                    upsellPending = true;
                } else {
                    replyMsg += " Anything else, or say confirm to place your order?";
                }

                await session.save();
                return res.json({
                    message: replyMsg,
                    order: session.current_order,
                    upsellPending
                });
            }
        }

        // -----------------------------------------------------
        // 🔹 FALLBACK TO FUSE.JS LOGIC
        // -----------------------------------------------------

        // Remove filler words
        const cleanedText = text
            .split(" ")
            .filter(w => !FILLER_WORDS.includes(w))
            .join(" ");

        // Split multi-item input: "burger and fries, coke"
        const parts = cleanedText.split(/\band\b|,/).map(p => p.trim()).filter(Boolean);

        const fuse = new Fuse(products, {
            keys: ["name"],
            threshold: 0.45,
            includeScore: true
        });

        const parsedItems = [];

        for (const raw of parts) {
            const { quantity, productText } = extractQuantityAndText(raw);
            if (!productText) continue;

            const rawResults = fuse.search(productText, { limit: 5 });
            const results = rawResults.filter(r => r.score !== undefined && r.score <= 0.45);

            if (!results.length) continue;

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
        }

        // Nothing matched
        if (!parsedItems.length) {
            return res.json({
                clarification: "Sorry, I couldn't find that on the menu. Could you try again or describe it differently?"
            });
        }

        // Merge items into running order
        mergeIntoOrder(session.current_order.items, parsedItems);
        session.markModified("current_order");

        // Combo upsell
        const combo = await Combo.findOne({ "items.product_id": parsedItems[0].product_id })
            .sort({ combo_score: -1 });

        const addedNames = parsedItems.map(i => `${i.quantity}x ${i.name}`).join(", ");
        let replyMsg = `✅ Added ${addedNames}. Order so far: ${orderSummary(session.current_order)}.`;
        let upsellPending = false;

        if (combo) {
            replyMsg += ` 🍱 How about our "${combo.combo_name}" combo for ₹${combo.combo_price}? Great value! Say yes or no.`;
            session.last_upsell = {
                combo_id: combo._id,
                combo_name: combo.combo_name,
                combo_price: combo.combo_price
            };
            upsellPending = true;
        } else {
            replyMsg += " Anything else, or say confirm to place your order?";
        }

        await session.save();

        return res.json({
            message: replyMsg,
            order: session.current_order,
            upsellPending
        });

    } catch (error) {
        console.error("❌ parseOrder error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};
