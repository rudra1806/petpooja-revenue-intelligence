const Product = require("../models/product.model");
const Combo = require("../models/combo.model");
const Session = require("../models/session.model");
const Fuse = require("fuse.js");

exports.parseOrder = async (req, res) => {

    try {

        let { text, sessionId } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Text missing" });
        }

        text = text.toLowerCase().trim();

        console.log("🎤 User said:", text);

        let session = await Session.findOne({ session_id: sessionId });

        if (!session) {
            session = await Session.create({
                session_id: sessionId,
                current_order: { items: [] }
            });
        }

        // =========================
        // CLARIFICATION HANDLER
        // =========================

        if (session.pending_clarification) {

            let chosen = null;

            for (const option of session.pending_clarification) {
                if (
                    text.includes(option.name.toLowerCase()) ||
                    option.name.toLowerCase().includes(text)
                ) {
                    chosen = option;
                    break;
                }
            }

            if (!chosen) {

                const fuseOptions = new Fuse(session.pending_clarification, {
                    keys: ["name"],
                    threshold: 0.6
                });

                const match = fuseOptions.search(text);

                if (match.length > 0) {
                    chosen = match[0].item;
                }
            }

            if (chosen) {

                const item = {
                    product_id: chosen.product_id,
                    name: chosen.name,
                    quantity: 1,
                    base_price: chosen.base_price,
                    selected_modifiers: []
                };

                session.current_order.items.push(item);
                session.pending_clarification = null;

                await session.save();

                const combo = await Combo.find({
                    "items.product_id": chosen.product_id
                })
                    .sort({ combo_score: -1 })
                    .limit(1);

                let upsell = null;

                if (combo.length > 0) {

                    upsell = `Would you like to try our ${combo[0].combo_name} for ₹${combo[0].combo_price}?`;

                    session.last_upsell = {
                        product_id: combo[0]._id,
                        name: combo[0].combo_name,
                        quantity: 1,
                        base_price: combo[0].combo_price
                    };

                    await session.save();
                }

                return res.json({
                    message: `Great! Adding ${chosen.name} to your order.`,
                    order: session.current_order,
                    upsell
                });
            }

            return res.json({
                clarification: `Please choose one: ${session.pending_clarification.map((p, i) => `${i + 1}. ${p.name}`).join(", ")}`
            });
        }

        // =========================
        // YES / NO UPSELL RESPONSE
        // =========================

        const confirmWords = ["yes", "yeah", "ok", "okay", "sure", "yep"];
        const rejectWords = ["no", "nope", "nah"];

        if (session.last_upsell) {

            if (confirmWords.some(word => text.includes(word))) {

                session.current_order.items.push(session.last_upsell);
                session.last_upsell = null;

                await session.save();

                return res.json({
                    message: "Great! I added that to your order. Would you like to confirm your order?",
                    order: session.current_order
                });
            }

            if (rejectWords.some(word => text.includes(word))) {

                session.last_upsell = null;
                await session.save();

                return res.json({
                    message: "Alright, continuing with your order. Would you like to confirm it?"
                });
            }
        }

        // =========================
        // ORDER CONFIRMATION
        // =========================

        const confirmOrderWords = ["confirm", "place order", "done", "finish"];

        if (confirmOrderWords.some(word => text.includes(word))) {

            const finalOrder = session.current_order;

            // CLEAR SESSION ORDER AFTER CONFIRMATION
            session.current_order = { items: [] };
            session.last_upsell = null;
            session.pending_clarification = null;

            await session.save();

            return res.json({
                message: `Perfect! Your order has been confirmed. You ordered ${finalOrder.items.map(i => `${i.quantity} ${i.name}`).join(", ")}.`,
                order: finalOrder,
                completed: true
            });
        }

        // =========================
        // REMOVE FILLER WORDS
        // =========================

        const fillerWords = [
            "give", "me", "can", "i", "get",
            "want", "please", "chahiye",
            "dena", "a", "an", "the"
        ];

        let cleanedText = text
            .split(" ")
            .filter(word => !fillerWords.includes(word))
            .join(" ");

        const parts = cleanedText.split(/and|,/);

        // =========================
        // FETCH PRODUCTS
        // =========================

        const products = await Product.find();

        if (products.length === 0) {
            return res.json({
                clarification: "Menu is currently empty."
            });
        }

        const fuse = new Fuse(products, {
            keys: ["name"],
            threshold: 0.5,
            includeScore: true
        });

        let items = [];

        const numberWords = {
            one: 1, two: 2, three: 3, four: 4, five: 5,
            six: 6, seven: 7, eight: 8, nine: 9, ten: 10
        };

        // =========================
        // PROCESS ORDER PARTS
        // =========================

        for (let rawPart of parts) {

            let part = rawPart.trim();
            if (!part) continue;

            let quantity = 1;

            const digitMatch = part.match(/\d+/);
            if (digitMatch) quantity = parseInt(digitMatch[0]);

            for (let word in numberWords) {
                if (part.includes(word)) quantity = numberWords[word];
            }

            part = part.replace(/\d+/g, "");

            Object.keys(numberWords).forEach(word => {
                part = part.replace(word, "");
            });

            part = part.trim();

            let productSearchText = part
                .replace(/\bwith\b/g, "")
                .replace(/\bwithout\b/g, "")
                .replace(/\bno\b/g, "")
                .trim();

            if (productSearchText.endsWith("s")) {
                productSearchText = productSearchText.slice(0, -1);
            }

            const rawResults = fuse.search(productSearchText, { limit: 5 });

            const results = rawResults.filter(r => r.score <= 0.4);

            if (results.length === 0) continue;

            // =========================
            // AMBIGUITY DETECTION
            // =========================

            if (results.length > 1) {

                const options = results.slice(0, 3).map(r => ({
                    product_id: r.item._id,
                    name: r.item.name,
                    base_price: r.item.selling_price
                }));

                session.pending_clarification = options;
                await session.save();

                return res.json({
                    clarification: `We have ${options.length} options: ${options.map((o, i) => `${i + 1}. ${o.name}`).join(", ")}. Which one would you like?`
                });
            }

            const matchedProduct = results[0].item;

            items.push({
                product_id: matchedProduct._id,
                name: matchedProduct.name,
                quantity,
                base_price: matchedProduct.selling_price,
                selected_modifiers: []
            });
        }

        // =========================
        // NOTHING MATCHED
        // =========================

        if (items.length === 0) {
            return res.json({
                clarification: "Sorry, I couldn't understand your order. Can you repeat?"
            });
        }

        session.current_order.items.push(...items);
        await session.save();

        // =========================
        // COMBO UPSELL
        // =========================

        const combo = await Combo.find({
            "items.product_id": items[0].product_id
        })
            .sort({ combo_score: -1 })
            .limit(1);

        let upsell = null;

        if (combo.length > 0) {

            upsell = `Would you like to try our ${combo[0].combo_name} for ₹${combo[0].combo_price}?`;

            session.last_upsell = {
                product_id: combo[0]._id,
                name: combo[0].combo_name,
                quantity: 1,
                base_price: combo[0].combo_price
            };

            await session.save();
        }

        return res.json({
            order: session.current_order,
            upsell
        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};