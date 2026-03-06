const Product = require("../models/product.model");
const Combo = require("../models/combo.model");
const Session = require("../models/session.model");
const Fuse = require("fuse.js");
const parseOrderWithAI = require("../services/aiOrderParser");
exports.parseOrder = async (req, res) => {

    try {

        let { text, sessionId } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Text missing" });
        }

        text = text.toLowerCase().trim();

        // =========================
        // SESSION LOAD / CREATE
        // =========================

        let session = await Session.findOne({ session_id: sessionId });

        if (!session) {
            session = await Session.create({
                session_id: sessionId,
                current_order: { items: [] }
            });
        }

        // =========================
        // YES / NO UPSELL RESPONSE
        // =========================

        const confirmWords = ["yes","yeah","ok","okay","sure","yep"];
        const rejectWords = ["no","nope","not","nah"];

        if(session.last_upsell){

            if(confirmWords.some(word => text.includes(word))){

                session.current_order.items.push(session.last_upsell);

                session.last_upsell = null;

                await session.save();

                return res.json({
                    message: "Great! I added that to your order.",
                    order: session.current_order
                });

            }

            if(rejectWords.some(word => text.includes(word))){

                session.last_upsell = null;

                await session.save();

                return res.json({
                    message: "Alright, continuing with your order."
                });

            }
        }

        // =========================
        // REMOVE FILLER WORDS
        // =========================

        const fillerWords = [
            "give","me","can","i","get",
            "want","please","chahiye",
            "dena","a","an","the"
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

        if(products.length === 0){
            return res.json({
                clarification: "Menu is currently empty."
            });
        }

        const fuse = new Fuse(products,{
            keys:["name"],
            threshold:0.4
        });

        let items = [];

        const numberWords = {
            one:1,two:2,three:3,four:4,five:5,
            six:6,seven:7,eight:8,nine:9,ten:10
        };

        // =========================
        // PROCESS EACH ORDER PART
        // =========================

        for(let rawPart of parts){

            let part = rawPart.trim();
            if(!part) continue;

            let quantity = 1;

            const digitMatch = part.match(/\d+/);

            if(digitMatch){
                quantity = parseInt(digitMatch[0]);
            }

            for(let word in numberWords){
                if(part.includes(word)){
                    quantity = numberWords[word];
                }
            }

            part = part.replace(/\d+/g,"");

            Object.keys(numberWords).forEach(word=>{
                part = part.replace(word,"");
            });

            part = part.trim();

            // REMOVE modifier keywords
            let productSearchText = part
                .replace(/\bwith\b/g,"")
                .replace(/\bwithout\b/g,"")
                .replace(/\bno\b/g,"")
                .trim();

            if(productSearchText.endsWith("s")){
                productSearchText = productSearchText.slice(0,-1);
            }

            const result = fuse.search(productSearchText);

            if(result.length === 0) continue;

            const matchedProduct = result[0].item;

            let selected_modifiers = [];

            if(matchedProduct.modifiers){

                for(let modifier of matchedProduct.modifiers){

                    const modifierName = modifier.name.toLowerCase();

                    if(
                        rawPart.includes("no "+modifierName) ||
                        rawPart.includes("without "+modifierName)
                    ){
                        selected_modifiers.push({
                            name:"No "+modifier.name,
                            price:0
                        });
                    }

                    else if(rawPart.includes(modifierName)){
                        selected_modifiers.push({
                            name:modifier.name,
                            price:modifier.price
                        });
                    }
                }
            }

            items.push({
                product_id: matchedProduct._id,
                name: matchedProduct.name,
                quantity,
                base_price: matchedProduct.selling_price,
                selected_modifiers
            });

        }

        // =========================
        // NOTHING MATCHED
        // =========================

        if(items.length === 0){
            return res.json({
                clarification:"Sorry, I couldn't understand your order. Can you repeat?"
            });
        }

        // ADD TO SESSION ORDER

        session.current_order.items.push(...items);

        await session.save();

        // =========================
        // COMBO UPSELL
        // =========================

        const combo = await Combo.find({
            "items.product_id": items[0].product_id
        })
        .sort({combo_score:-1})
        .limit(1);

        let upsell = null;

        if(combo.length > 0){

            upsell = `Would you like to try our ${combo[0].combo_name} for ₹${combo[0].combo_price}?`;

            session.last_upsell = {
                product_id: combo[0]._id,
                name: combo[0].combo_name,
                quantity:1,
                base_price:combo[0].combo_price
            };

            await session.save();
        }

        return res.json({
            order: session.current_order,
            upsell
        });

    }
    catch(error){

        console.error(error);

        res.status(500).json({
            message:"Server error"
        });
    }

};