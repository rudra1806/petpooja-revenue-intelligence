const Product = require("../models/product.model.js");
const Order = require("../models/order.model.js");
const Combo = require("../models/combo.model.js");

// ─── CATEGORY COMPATIBILITY MATRIX ──────────────────────────────────────────
// Scores 0-1 indicating how well two categories pair together culinarily.
// Prevents nonsensical combos like "Burger + Raita"
const COMPATIBILITY = {
    main: { main: 0.2, snack: 0.9, dessert: 0.5, beverages: 0.95 },
    snack: { main: 0.9, snack: 0.3, dessert: 0.4, beverages: 0.9 },
    dessert: { main: 0.3, snack: 0.4, dessert: 0.2, beverages: 0.8 },
    beverages: { main: 0.95, snack: 0.9, dessert: 0.8, beverages: 0.2 },
};

// Cuisine tags for cross-cuisine filtering
const CUISINE_TAGS = {
    "Classic Burger": "western",
    "Margherita Pizza": "italian",
    "Penne Pasta": "italian",
    "Grilled Sandwich": "western",
    "Chicken Wrap": "western",
    "Paneer Tikka Wrap": "indian",
    "Veggie Burger": "western",
    "Pepperoni Pizza": "italian",
    "French Fries": "universal",
    "Chicken Nuggets": "universal",
    "Garlic Bread": "universal",
    "Onion Rings": "universal",
    "Mozzarella Sticks": "universal",
    "Chocolate Brownie": "universal",
    "Vanilla Ice Cream": "universal",
    "New York Cheesecake": "western",
    "Gulab Jamun": "indian",
    "Chocolate Mousse": "universal",
    "Coke": "universal",
    "Mango Lassi": "indian",
    "Cold Coffee": "universal",
    "Fresh Lemonade": "universal",
    "Masala Chai": "indian",
    "Mojito": "universal",
    "Chocolate Milkshake": "universal",
};

// ─── HELPER: Check cuisine compatibility ─────────────────────────────────────
function areCuisinesCompatible(nameA, nameB) {
    const tagA = CUISINE_TAGS[nameA] || "universal";
    const tagB = CUISINE_TAGS[nameB] || "universal";
    if (tagA === "universal" || tagB === "universal") return true;
    return tagA === tagB;
}

// ─── HELPER: Get compatibility score for a set of products ───────────────────
function getCompatibilityScore(products) {
    if (products.length < 2) return 1;
    let totalScore = 0;
    let pairs = 0;
    for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
            const catA = products[i].category;
            const catB = products[j].category;
            const catScore = COMPATIBILITY[catA]?.[catB] ?? 0.5;
            const cuisineOk = areCuisinesCompatible(products[i].name, products[j].name);
            totalScore += cuisineOk ? catScore : catScore * 0.3;
            pairs++;
        }
    }
    return pairs > 0 ? totalScore / pairs : 0;
}

// ─── STEP 1: Product Analytics ───────────────────────────────────────────────
async function computeProductAnalytics() {
    const products = await Product.find().lean();
    const orders = await Order.find().lean();
    const totalOrders = orders.length;

    // Count units sold and order appearances per product
    const salesMap = {};
    for (const order of orders) {
        const seenInOrder = new Set();
        for (const item of order.items) {
            const pid = item.product_id.toString();
            if (!salesMap[pid]) {
                salesMap[pid] = { unitsSold: 0, orderCount: 0, revenue: 0 };
            }
            salesMap[pid].unitsSold += item.quantity;
            salesMap[pid].revenue += (item.base_price || 0) * item.quantity;
            seenInOrder.add(pid);
        }
        for (const pid of seenInOrder) {
            salesMap[pid].orderCount++;
        }
    }

    const totalRevenue = Object.values(salesMap).reduce((s, v) => s + v.revenue, 0);

    // Compute metrics for each product
    const analytics = products.map(p => {
        const pid = p._id.toString();
        const stats = salesMap[pid] || { unitsSold: 0, orderCount: 0, revenue: 0 };
        const margin = p.selling_price - p.cost;
        const marginPct = (margin / p.selling_price) * 100;
        const orderFrequency = totalOrders > 0 ? stats.orderCount / totalOrders : 0;
        const revenueShare = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;

        // Classification
        const medianMarginPct = 50;
        const medianFrequency = 0.15;
        let classification;
        if (marginPct >= medianMarginPct && orderFrequency >= medianFrequency) {
            classification = "star";
        } else if (marginPct >= medianMarginPct && orderFrequency < medianFrequency) {
            classification = "hidden_gem";
        } else if (marginPct < medianMarginPct && orderFrequency >= medianFrequency) {
            classification = "volume_trap";
        } else {
            classification = "dog";
        }

        return {
            product_id: p._id,
            name: p.name,
            category: p.category,
            selling_price: p.selling_price,
            cost: p.cost,
            margin,
            margin_pct: parseFloat(marginPct.toFixed(1)),
            units_sold: stats.unitsSold,
            order_frequency: parseFloat(orderFrequency.toFixed(3)),
            revenue_share: parseFloat(revenueShare.toFixed(2)),
            classification,
            max_discount_pct: p.max_discount_pct ?? null,   // from pricing dashboard
            suggested_price: p.suggested_price ?? null,     // from pricing dashboard
        };
    });

    return analytics;
}

// ─── STEP 2: Association Mining ──────────────────────────────────────────────
async function computeAssociationRules() {
    const orders = await Order.find().lean();
    const totalOrders = orders.length;
    if (totalOrders === 0) return [];

    // Count single item frequencies and pair co-occurrences
    const itemFreq = {};
    const pairFreq = {};

    for (const order of orders) {
        const productIds = [...new Set(order.items.map(i => i.product_id.toString()))];

        for (const pid of productIds) {
            itemFreq[pid] = (itemFreq[pid] || 0) + 1;
        }

        // Generate all pairs
        for (let i = 0; i < productIds.length; i++) {
            for (let j = i + 1; j < productIds.length; j++) {
                const key = [productIds[i], productIds[j]].sort().join("|");
                pairFreq[key] = (pairFreq[key] || 0) + 1;
            }
        }
    }

    // Build product name lookup
    const products = await Product.find().lean();
    const nameMap = {};
    const productMap = {};
    for (const p of products) {
        nameMap[p._id.toString()] = p.name;
        productMap[p._id.toString()] = p;
    }

    // Calculate support, confidence, lift for each pair
    const rules = [];
    for (const [key, count] of Object.entries(pairFreq)) {
        const [idA, idB] = key.split("|");
        const support = count / totalOrders;
        const freqA = (itemFreq[idA] || 0) / totalOrders;
        const freqB = (itemFreq[idB] || 0) / totalOrders;
        const confidenceAB = itemFreq[idA] ? count / itemFreq[idA] : 0;
        const confidenceBA = itemFreq[idB] ? count / itemFreq[idB] : 0;
        const confidence = Math.max(confidenceAB, confidenceBA);
        const lift = (freqA * freqB) > 0 ? support / (freqA * freqB) : 0;

        if (support >= 0.02) {
            rules.push({
                items: [
                    { product_id: idA, name: nameMap[idA] || idA },
                    { product_id: idB, name: nameMap[idB] || idB },
                ],
                support: parseFloat(support.toFixed(4)),
                confidence: parseFloat(confidence.toFixed(4)),
                lift: parseFloat(lift.toFixed(4)),
            });
        }
    }

    rules.sort((a, b) => b.lift - a.lift);
    return { rules, itemFreq, pairFreq, totalOrders, nameMap, productMap };
}

// ─── STEP 3: Smart Combo Generator ──────────────────────────────────────────
const generateSmartCombos = async (req, res) => {
    try {
        const productAnalytics = await computeProductAnalytics();
        const { rules, itemFreq, totalOrders, nameMap, productMap } = await computeAssociationRules();

        const allProducts = await Product.find().lean();
        const analyticsMap = {};
        for (const a of productAnalytics) {
            analyticsMap[a.product_id.toString()] = a;
        }

        const candidateCombos = [];

        // ─── STRATEGY 1: Pattern-Based (from association rules) ──────────
        for (const rule of rules) {
            if (rule.confidence < 0.3 || rule.lift < 1.0) continue;

            const idA = rule.items[0].product_id;
            const idB = rule.items[1].product_id;
            const pA = productMap[idA];
            const pB = productMap[idB];
            if (!pA || !pB) continue;

            // Try adding a beverage if neither is a beverage
            const comboProducts = [pA, pB];
            if (pA.category !== "beverages" && pB.category !== "beverages") {
                const bestBev = allProducts
                    .filter(p => p.category === "beverages")
                    .sort((a, b) => {
                        const freqA = (itemFreq[a._id.toString()] || 0);
                        const freqB = (itemFreq[b._id.toString()] || 0);
                        return freqB - freqA;
                    })[0];
                if (bestBev) comboProducts.push(bestBev);
            }

            const compatScore = getCompatibilityScore(comboProducts);
            if (compatScore < 0.4) continue;

            const totalSelling = comboProducts.reduce((s, p) => s + p.selling_price, 0);
            const totalCost = comboProducts.reduce((s, p) => s + p.cost, 0);
            // ─── DATA-DRIVEN COMBO DISCOUNT (was hardcoded 10%) ──────────
            // Instead of a fixed 10% discount, we now average the max_discount_pct
            // across all products in the combo. If a product hasn't had its
            // discount threshold set yet (null), we fall back to 10%.
            // The result is capped at 15% to prevent over-discounting.
            // e.g., products with max_discount [10%, 25%, 10%] → avg=15% → capped at 15%
            const avgMaxDiscount = comboProducts.reduce((s, p) => s + (p.max_discount_pct != null ? p.max_discount_pct : 10), 0) / comboProducts.length;
            const discountPct = Math.min(avgMaxDiscount, 15) / 100;
            const discountAmt = Math.round(totalSelling * discountPct);
            const comboPrice = totalSelling - discountAmt;
            const profitMargin = (comboPrice - totalCost) / comboPrice;

            const hasHiddenGem = comboProducts.some(p =>
                analyticsMap[p._id.toString()]?.classification === "hidden_gem"
            );

            const categories = new Set(comboProducts.map(p => p.category));
            const diversityBonus = categories.size >= 3 ? 1.0 : categories.size === 2 ? 0.6 : 0.2;

            const associationScore = Math.min(1, (rule.lift / 3) * rule.confidence);
            const profitScore = Math.min(1, profitMargin);
            const strategicBoost = hasHiddenGem ? 1.0 : 0.4;

            const comboScore =
                0.30 * associationScore +
                0.25 * profitScore +
                0.20 * strategicBoost +
                0.15 * compatScore +
                0.10 * diversityBonus;

            candidateCombos.push({
                strategy: "pattern_based",
                combo_name: comboProducts.map(p => p.name.split(" ")[0]).join(" + ") + " Combo",
                description: `${comboProducts.map(p => p.name).join(" + ")} — ${Math.round(rule.confidence * 100)}% buying pattern (Lift: ${rule.lift.toFixed(1)})`,
                items: comboProducts.map(p => ({
                    product_id: p._id,
                    name: p.name,
                    quantity: 1,
                    base_price: p.selling_price,
                })),
                total_selling_price: totalSelling,
                combo_price: comboPrice,
                discount: discountAmt,
                total_cost: totalCost,
                support: rule.support,
                confidence: rule.confidence,
                lift: rule.lift,
                compatibility_score: parseFloat(compatScore.toFixed(3)),
                combo_score: parseFloat(comboScore.toFixed(4)),
                has_hidden_gem: hasHiddenGem,
                categories: [...categories],
            });
        }

        // ─── STRATEGY 2: Hidden Gem Boost ────────────────────────────────
        const hiddenGems = productAnalytics.filter(a => a.classification === "hidden_gem");
        const stars = productAnalytics.filter(a => a.classification === "star");

        for (const gem of hiddenGems) {
            const gemProduct = productMap[gem.product_id.toString()];
            if (!gemProduct) continue;

            // Find best star from a compatible category
            for (const star of stars) {
                const starProduct = productMap[star.product_id.toString()];
                if (!starProduct) continue;
                if (gemProduct.category === starProduct.category) continue;

                const comboProducts = [starProduct, gemProduct];

                // Add a beverage if neither is one
                if (starProduct.category !== "beverages" && gemProduct.category !== "beverages") {
                    const bestBev = allProducts
                        .filter(p => p.category === "beverages")
                        .sort((a, b) => (b.selling_price - b.cost) - (a.selling_price - a.cost))[0];
                    if (bestBev) comboProducts.push(bestBev);
                }

                const compatScore = getCompatibilityScore(comboProducts);
                if (compatScore < 0.5) continue;

                const totalSelling = comboProducts.reduce((s, p) => s + p.selling_price, 0);
                const totalCost = comboProducts.reduce((s, p) => s + p.cost, 0);
                // ─── DATA-DRIVEN COMBO DISCOUNT (was hardcoded 12%) ──────
                // Hidden gem boost combos get a slightly higher default (12%)
                // since the goal is to boost discovery of low-demand items.
                // Cap at 20% to preserve profitability.
                const avgMaxDiscount = comboProducts.reduce((s, p) => s + (p.max_discount_pct != null ? p.max_discount_pct : 12), 0) / comboProducts.length;
                const discountPct = Math.min(avgMaxDiscount, 20) / 100;
                const discountAmt = Math.round(totalSelling * discountPct);
                const comboPrice = totalSelling - discountAmt;
                const profitMargin = (comboPrice - totalCost) / comboPrice;

                const categories = new Set(comboProducts.map(p => p.category));
                const diversityBonus = categories.size >= 3 ? 1.0 : categories.size === 2 ? 0.6 : 0.2;

                const comboScore =
                    0.30 * 0.3 +
                    0.25 * Math.min(1, profitMargin) +
                    0.20 * 1.0 +
                    0.15 * compatScore +
                    0.10 * diversityBonus;

                candidateCombos.push({
                    strategy: "hidden_gem_boost",
                    combo_name: `${starProduct.name.split(" ")[0]} & ${gemProduct.name.split(" ")[0]} Combo`,
                    description: `Boost hidden gem ${gemProduct.name} by pairing with star ${starProduct.name}`,
                    items: comboProducts.map(p => ({
                        product_id: p._id,
                        name: p.name,
                        quantity: 1,
                        base_price: p.selling_price,
                    })),
                    total_selling_price: totalSelling,
                    combo_price: comboPrice,
                    discount: discountAmt,
                    total_cost: totalCost,
                    support: 0,
                    confidence: 0,
                    lift: 0,
                    compatibility_score: parseFloat(compatScore.toFixed(3)),
                    combo_score: parseFloat(comboScore.toFixed(4)),
                    has_hidden_gem: true,
                    categories: [...categories],
                    hidden_gem: gemProduct.name,
                    paired_with_star: starProduct.name,
                });
            }
        }

        // ─── DEDUPLICATE & SORT ──────────────────────────────────────────
        const seen = new Set();
        const uniqueCombos = [];
        for (const combo of candidateCombos) {
            const key = combo.items.map(i => i.product_id.toString()).sort().join("|");
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCombos.push(combo);
            }
        }

        uniqueCombos.sort((a, b) => b.combo_score - a.combo_score);

        // Take top 15
        const topCombos = uniqueCombos.slice(0, 15);

        return res.status(200).json({
            success: true,
            message: "Smart combos generated successfully",
            total_orders_analyzed: totalOrders,
            total_products: allProducts.length,
            product_classifications: {
                stars: productAnalytics.filter(a => a.classification === "star").map(a => a.name),
                hidden_gems: productAnalytics.filter(a => a.classification === "hidden_gem").map(a => a.name),
                volume_traps: productAnalytics.filter(a => a.classification === "volume_trap").map(a => a.name),
                dogs: productAnalytics.filter(a => a.classification === "dog").map(a => a.name),
            },
            combos_generated: topCombos.length,
            combos: topCombos,
        });
    } catch (error) {
        console.error("generateSmartCombos error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── STEP 4: Product Analytics Endpoint ──────────────────────────────────────
const getProductAnalytics = async (req, res) => {
    try {
        const analytics = await computeProductAnalytics();
        return res.status(200).json({
            success: true,
            total_products: analytics.length,
            data: analytics,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── STEP 5: Association Rules Endpoint ──────────────────────────────────────
const getAssociationRules = async (req, res) => {
    try {
        const { rules, totalOrders } = await computeAssociationRules();
        return res.status(200).json({
            success: true,
            total_orders_analyzed: totalOrders,
            total_rules: rules.length,
            data: rules,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── STEP 6: Upsell Suggestions for a specific product ──────────────────────
// GET /api/combo/suggest/:productId
// When user adds a product (e.g. Burger), suggest individual items + combos
const getSuggestions = async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate the product exists
        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const orders = await Order.find().lean();
        const totalOrders = orders.length;
        const allProducts = await Product.find().lean();

        const productMapById = {};
        for (const p of allProducts) {
            productMapById[p._id.toString()] = p;
        }

        // ─── Find co-purchased items from order history ──────────────────
        const targetId = productId.toString();
        let targetOrderCount = 0;          // orders containing this product
        const coOccurrence = {};           // other product_id → count

        for (const order of orders) {
            const productIds = [...new Set(order.items.map(i => i.product_id.toString()))];
            if (!productIds.includes(targetId)) continue;

            targetOrderCount++;
            for (const pid of productIds) {
                if (pid === targetId) continue;
                coOccurrence[pid] = (coOccurrence[pid] || 0) + 1;
            }
        }

        // ─── Rank individual item suggestions ────────────────────────────
        const suggestions = [];
        for (const [pid, count] of Object.entries(coOccurrence)) {
            const otherProduct = productMapById[pid];
            if (!otherProduct) continue;

            const confidence = targetOrderCount > 0 ? count / targetOrderCount : 0;
            const otherFreq = orders.filter(o =>
                o.items.some(i => i.product_id.toString() === pid)
            ).length / totalOrders;
            const lift = otherFreq > 0 ? (count / totalOrders) / ((targetOrderCount / totalOrders) * otherFreq) : 0;

            // Category compatibility
            const catScore = COMPATIBILITY[product.category]?.[otherProduct.category] ?? 0.5;
            const cuisineOk = areCuisinesCompatible(product.name, otherProduct.name);
            const compatScore = cuisineOk ? catScore : catScore * 0.3;

            // Skip incompatible items
            if (compatScore < 0.4) continue;

            // Profit margin of the suggested item
            const margin = otherProduct.selling_price - otherProduct.cost;
            const marginPct = otherProduct.selling_price > 0 ? margin / otherProduct.selling_price : 0;

            // Upsell priority score
            const upsellScore =
                0.40 * confidence +
                0.25 * Math.min(1, marginPct) +
                0.20 * compatScore +
                0.15 * Math.min(1, lift / 2);

            // ─── Build insightful reason & tags ─────────────────────────
            const insightTags = [];
            let reason = "";
            let insight = "";

            // Buying pattern insight
            if (confidence >= 0.5) {
                reason = `${Math.round(confidence * 100)}% of ${product.name} buyers also buy ${otherProduct.name}`;
                insightTags.push("Strong Pattern");
            } else if (confidence >= 0.3) {
                reason = `${Math.round(confidence * 100)}% co-purchase rate with ${product.name}`;
                insightTags.push("Moderate Pattern");
            } else if (lift > 2) {
                reason = `${lift.toFixed(1)}x more likely to be ordered with ${product.name} than average`;
                insightTags.push("Strong Affinity");
            } else if (lift > 1.2) {
                reason = `${lift.toFixed(1)}x above-average co-occurrence with ${product.name}`;
                insightTags.push("Above Average");
            } else {
                reason = `Bought ${count} times with ${product.name} across ${targetOrderCount} orders`;
            }

            // Margin insight
            if (marginPct >= 0.7) {
                insightTags.push("High Margin");
                insight += `💰 High-margin item (${(marginPct * 100).toFixed(0)}%) — ₹${margin} profit per unit. `;
            } else if (marginPct >= 0.5) {
                insightTags.push("Good Margin");
                insight += `Decent margin (${(marginPct * 100).toFixed(0)}%) — ₹${margin} profit per unit. `;
            } else {
                insightTags.push("Low Margin");
                insight += `⚠️ Low margin (${(marginPct * 100).toFixed(0)}%) — only ₹${margin} profit. `;
            }

            // Category insight
            if (otherProduct.category === "beverages") {
                insight += `🥤 Beverage upsell adds quick revenue with minimal kitchen load. `;
            } else if (otherProduct.category === "dessert") {
                insight += `🍰 Dessert add-on increases avg check value. `;
            } else if (otherProduct.category === "snack") {
                insight += `🍟 Side item increases order value with fast prep time. `;
            }

            // Lift insight
            if (lift > 2.5) {
                insight += `📊 Very high lift (${lift.toFixed(1)}) — this pair has an unusually strong buying affinity.`;
            } else if (lift > 1.5) {
                insight += `📊 Good lift (${lift.toFixed(1)}) — these items are bought together more than random chance.`;
            } else if (lift < 0.5) {
                insight += `⚠️ Low lift (${lift.toFixed(1)}) — customers don't specifically seek this pair.`;
            }

            suggestions.push({
                product_id: otherProduct._id,
                name: otherProduct.name,
                category: otherProduct.category,
                selling_price: otherProduct.selling_price,
                confidence: parseFloat(confidence.toFixed(3)),
                lift: parseFloat(lift.toFixed(3)),
                compatibility: parseFloat(compatScore.toFixed(2)),
                margin_pct: parseFloat((marginPct * 100).toFixed(1)),
                profit_per_unit: margin,
                upsell_score: parseFloat(upsellScore.toFixed(4)),
                times_bought_together: count,
                reason,
                insight: insight.trim(),
                insight_tags: insightTags,
            });
        }

        suggestions.sort((a, b) => b.upsell_score - a.upsell_score);

        // ─── Find matching combos from DB ────────────────────────────────
        const matchingCombos = await Combo.find({
            "items.product_id": product._id
        }).sort({ combo_score: -1 }).lean();

        return res.status(200).json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                category: product.category,
                selling_price: product.selling_price,
            },
            total_orders_analyzed: totalOrders,
            orders_containing_product: targetOrderCount,
            individual_suggestions: suggestions.slice(0, 10),
            combo_suggestions: matchingCombos.map(c => ({
                combo_id: c._id,
                combo_name: c.combo_name,
                combo_price: c.combo_price,
                discount: c.discount,
                combo_score: c.combo_score,
                items: c.items,
            })),
        });
    } catch (error) {
        console.error("getSuggestions error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Combo-specific Analytics ────────────────────────────────────────────────
// GET /api/combo/analytics/combo/:comboId
const getComboAnalytics = async (req, res) => {
    try {
        const { comboId } = req.params;
        const combo = await Combo.findById(comboId).lean();
        if (!combo) {
            return res.status(404).json({ success: false, message: "Combo not found" });
        }

        const productAnalytics = await computeProductAnalytics();
        const analyticsMap = {};
        for (const a of productAnalytics) {
            analyticsMap[a.product_id.toString()] = a;
        }

        const orders = await Order.find().lean();
        const totalOrders = orders.length;
        const allProducts = await Product.find().lean();
        const productMap = {};
        for (const p of allProducts) {
            productMap[p._id.toString()] = p;
        }

        // Item-level analytics
        const itemIds = combo.items.map(i => i.product_id.toString());
        const item_analytics = combo.items.map(i => {
            const pid = i.product_id.toString();
            const pa = analyticsMap[pid];
            const prod = productMap[pid];
            return {
                name: i.name,
                category: prod?.category || "unknown",
                selling_price: i.base_price,
                cost: prod?.cost || 0,
                margin_pct: pa?.margin_pct || 0,
                units_sold: pa?.units_sold || 0,
                order_frequency: pa?.order_frequency || 0,
                classification: pa?.classification || "dog",
            };
        });

        // Pairwise association data
        const itemFreq = {};
        const pairFreq = {};
        for (const order of orders) {
            const pids = [...new Set(order.items.map(i => i.product_id.toString()))];
            for (const pid of pids) {
                itemFreq[pid] = (itemFreq[pid] || 0) + 1;
            }
            for (let i = 0; i < pids.length; i++) {
                for (let j = i + 1; j < pids.length; j++) {
                    const key = [pids[i], pids[j]].sort().join("|");
                    pairFreq[key] = (pairFreq[key] || 0) + 1;
                }
            }
        }

        const pairwise_associations = [];
        for (let i = 0; i < itemIds.length; i++) {
            for (let j = i + 1; j < itemIds.length; j++) {
                const idA = itemIds[i];
                const idB = itemIds[j];
                const key = [idA, idB].sort().join("|");
                const count = pairFreq[key] || 0;
                const freqA = itemFreq[idA] || 0;
                const freqB = itemFreq[idB] || 0;
                const confAB = freqA > 0 ? count / freqA : 0;
                const confBA = freqB > 0 ? count / freqB : 0;
                const lift = (freqA > 0 && freqB > 0 && totalOrders > 0)
                    ? (count / totalOrders) / ((freqA / totalOrders) * (freqB / totalOrders))
                    : 0;

                let affinity = "weak";
                if (lift >= 2.5 && Math.max(confAB, confBA) >= 0.4) affinity = "very_strong";
                else if (lift >= 1.5 && Math.max(confAB, confBA) >= 0.3) affinity = "strong";
                else if (lift >= 1.0) affinity = "moderate";

                const nameA = combo.items.find(it => it.product_id.toString() === idA)?.name || idA;
                const nameB = combo.items.find(it => it.product_id.toString() === idB)?.name || idB;

                pairwise_associations.push({
                    item_a: nameA,
                    item_b: nameB,
                    times_bought_together: count,
                    confidence_a_to_b: parseFloat(confAB.toFixed(4)),
                    confidence_b_to_a: parseFloat(confBA.toFixed(4)),
                    lift: parseFloat(lift.toFixed(4)),
                    affinity,
                });
            }
        }

        // Full-combo co-occurrence (all items in same order)
        let fullComboOrders = 0;
        for (const order of orders) {
            const orderPids = new Set(order.items.map(i => i.product_id.toString()));
            if (itemIds.every(id => orderPids.has(id))) fullComboOrders++;
        }

        // Compatibility score
        const comboProducts = itemIds.map(id => productMap[id]).filter(Boolean);
        const compatScore = getCompatibilityScore(comboProducts);

        // Overall
        const totalCost = comboProducts.reduce((s, p) => s + p.cost, 0);
        const comboMargin = combo.combo_price - totalCost;
        const comboMarginPct = combo.combo_price > 0 ? ((comboMargin / combo.combo_price) * 100).toFixed(1) : "0";
        const savings = combo.total_selling_price - combo.combo_price;
        const savingsPct = combo.total_selling_price > 0 ? ((savings / combo.total_selling_price) * 100).toFixed(1) : "0";

        return res.status(200).json({
            success: true,
            combo: { combo_name: combo.combo_name },
            overall: {
                combo_margin: comboMargin,
                combo_margin_pct: comboMarginPct,
                savings_for_customer: savings,
                savings_pct: savingsPct,
                compatibility_score: parseFloat(compatScore.toFixed(2)),
                full_combo_orders: fullComboOrders,
                full_combo_rate: totalOrders > 0 ? ((fullComboOrders / totalOrders) * 100).toFixed(1) : "0",
                total_orders_analyzed: totalOrders,
            },
            item_analytics,
            pairwise_associations,
        });
    } catch (error) {
        console.error("getComboAnalytics error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── STEP 7: Pricing & Discount Recommendations ─────────────────────────────
// PURPOSE: Computes data-driven price suggestions and max discount thresholds
// for every product. The owner sees these on the "Pricing" dashboard and can
// accept, customize, or reject each recommendation.
//
// HOW IT WORKS:
// 1. Reuses computeProductAnalytics() to get BCG classification (star/hidden_gem/volume_trap/dog)
// 2. Computes demand score (0-100) and revenue contribution per product
// 3. Calculates margin headroom = current margin% - 20% (min acceptable margin)
// 4. Uses quadrant-specific rules to determine:
//    - How much to adjust the price (increase for stars/volume_traps, decrease for hidden_gems/dogs)
//    - The maximum discount % the product can sustain without going below 20% margin
// 5. Returns per-product recommendations + a summary of overall revenue impact
//
// ENDPOINT: GET /api/combo/analytics/pricing
const getPricingRecommendations = async (req, res) => {
    try {
        // Step 1: Get BCG classification and metrics for all products
        const productAnalytics = await computeProductAnalytics();
        const orders = await Order.find().lean();
        const totalOrders = orders.length;
        const allProducts = await Product.find().lean();

        // Build a lookup map: product_id → product document
        const productMap = {};
        for (const p of allProducts) {
            productMap[p._id.toString()] = p;
        }

        // Calculate total revenue across all products (used for revenue contribution %)
        const totalRevenue = productAnalytics.reduce((s, p) => {
            const stats = orders.reduce((acc, order) => {
                for (const item of order.items) {
                    if (item.product_id.toString() === p.product_id.toString()) {
                        acc += (item.base_price || 0) * item.quantity;
                    }
                }
                return acc;
            }, 0);
            return s + stats;
        }, 0);

        // ─── MARGIN-VS-DEMAND TRADEOFF THRESHOLDS ────────────────────────
        // MIN_ACCEPTABLE_MARGIN: the hard floor — we never price below this.
        // REMOVAL_MARGIN_THRESHOLD: if margin is ALSO below this, suggest removal.
        // These are expressed as percentages of selling price.
        const MIN_ACCEPTABLE_MARGIN = 30;    // 30% — hard price floor
        const REMOVAL_MARGIN_THRESHOLD = 30; // if margin < 30% AND demand is low → suggest removal

        // ─── COMPUTE RECOMMENDATIONS FOR EACH PRODUCT ─────────────────
        const recommendations = productAnalytics.map(pa => {
            const product = productMap[pa.product_id.toString()];
            if (!product) return null;

            // ── Normalized inputs (all 0–1) ──────────────────────────────
            // demandNorm:   how frequently this product appears in orders
            // headroomNorm: how much margin buffer exists above the 30% floor
            const demandScore = Math.min(100, parseFloat((pa.order_frequency * 100 * 2).toFixed(1)));
            const demandNorm = demandScore / 100;
            const marginHeadroom = Math.max(0, pa.margin_pct - MIN_ACCEPTABLE_MARGIN);
            const headroomNorm = Math.min(1, marginHeadroom / 50); // 50% headroom = fully saturated
            const revenueContribution = pa.revenue_share;

            // ── REMOVAL FLAG (Dog quadrant: low margin + low demand) ─────
            const isDog = pa.classification === "dog";
            const shouldRemove = isDog && pa.margin_pct < REMOVAL_MARGIN_THRESHOLD;
            const removeReason = shouldRemove
                ? `Margin is ${pa.margin_pct.toFixed(1)}% (below ${REMOVAL_MARGIN_THRESHOLD}% threshold) and demand is very low (score: ${demandScore}). Keeping this item hurts overall profitability.`
                : null;

            // ── PRICE ADJUSTMENT ─────────────────────────────────────────
            let priceAdjustPct;
            let strategy;
            let maxDiscountCap;

            if (pa.classification === "star") {
                priceAdjustPct = 2 + demandNorm * 10 + headroomNorm * 2;
                priceAdjustPct = Math.min(priceAdjustPct, 14);
                maxDiscountCap = 8;
                strategy = "Premium pricing — strong demand supports a price increase. Keep discounts minimal.";

            } else if (pa.classification === "hidden_gem") {
                const discountStrength = headroomNorm * (1 - demandNorm);
                priceAdjustPct = -(discountStrength * 15);
                priceAdjustPct = Math.max(priceAdjustPct, -15);
                maxDiscountCap = Math.min(marginHeadroom, 25);
                strategy = `Boost sales — this product has strong margins (${pa.margin_pct.toFixed(1)}%) but low demand (score: ${demandScore}). Offering a discount of up to ${maxDiscountCap.toFixed(1)}% will drive discovery without hurting profitability.`;

            } else if (pa.classification === "volume_trap") {
                const marginDeficit = Math.max(0, (50 - pa.margin_pct) / 50);
                priceAdjustPct = 5 + marginDeficit * 10;
                priceAdjustPct = Math.min(priceAdjustPct, 15);
                maxDiscountCap = 3;
                strategy = `Margin recovery — customers love this product (demand: ${demandScore}) but margins are thin at ${pa.margin_pct.toFixed(1)}%. A price increase is needed to stay profitable.`;

            } else {
                if (shouldRemove) {
                    priceAdjustPct = 0;
                    maxDiscountCap = 0;
                    strategy = `Consider removing — margin (${pa.margin_pct.toFixed(1)}%) is below your ${REMOVAL_MARGIN_THRESHOLD}% threshold and demand is very low. This item is reducing your overall profitability.`;
                } else {
                    const cutStrength = (1 - demandNorm);
                    priceAdjustPct = -(cutStrength * 8);
                    priceAdjustPct = Math.max(priceAdjustPct, -8);
                    maxDiscountCap = Math.min(marginHeadroom, 15);
                    strategy = `Test demand — low sales but margins are still above threshold. A moderate price reduction may revive interest. If sales don't improve, consider removing from the menu.`;
                }
            }

            priceAdjustPct = parseFloat(priceAdjustPct.toFixed(1));

            // ── Apply adjustment + safety floor ─────────────────────────
            const suggestedPrice = Math.round(product.selling_price * (1 + priceAdjustPct / 100));
            const minPrice = Math.round(product.cost / (1 - MIN_ACCEPTABLE_MARGIN / 100));
            const finalSuggestedPrice = Math.max(suggestedPrice, minPrice);
            const maxDiscountPct = Math.min(marginHeadroom, maxDiscountCap);

            return {
                product_id: pa.product_id,
                name: pa.name,
                category: pa.category,
                current_price: product.selling_price,
                cost: product.cost,
                suggested_price: finalSuggestedPrice,
                price_change_pct: priceAdjustPct,
                price_change_amt: finalSuggestedPrice - product.selling_price,
                min_price: minPrice,
                max_discount_pct: parseFloat(maxDiscountPct.toFixed(1)),
                max_discount_amt: Math.round(product.selling_price * maxDiscountPct / 100),
                margin_pct: pa.margin_pct,
                margin_headroom: parseFloat(marginHeadroom.toFixed(1)),
                demand_score: demandScore,
                revenue_contribution: revenueContribution,
                units_sold: pa.units_sold,
                order_frequency: pa.order_frequency,
                classification: pa.classification,
                strategy,
                should_remove: shouldRemove,
                remove_reason: removeReason,
            };
        }).filter(Boolean);

        // ─── SUMMARY STATISTICS ─────────────────────────────────────
        // These are shown in the dashboard's top-level summary cards
        const avgMargin = (recommendations.reduce((s, r) => s + r.margin_pct, 0) / recommendations.length).toFixed(1);
        // Estimate total revenue impact if ALL suggestions were applied:
        // sum of (price change per unit × units sold historically)
        const totalPotentialRevChange = recommendations.reduce((s, r) => s + r.price_change_amt * r.units_sold, 0);

        return res.status(200).json({
            success: true,
            total_products: recommendations.length,
            total_orders_analyzed: totalOrders,
            min_acceptable_margin: MIN_ACCEPTABLE_MARGIN,
            summary: {
                avg_margin: parseFloat(avgMargin),
                potential_revenue_change: totalPotentialRevChange,
                products_to_increase: recommendations.filter(r => r.price_change_amt > 0).length,
                products_to_decrease: recommendations.filter(r => r.price_change_amt < 0).length,
                products_no_change: recommendations.filter(r => r.price_change_amt === 0).length,
                products_to_remove: recommendations.filter(r => r.should_remove).length,
            },
            data: recommendations,
        });
    } catch (error) {
        console.error("getPricingRecommendations error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── STEP 8: Apply Pricing Recommendation ────────────────────────────────────
// PURPOSE: Called when the owner clicks "Apply Suggestion" or "Save Custom"
// on the Pricing Dashboard. Persists the chosen price and discount threshold
// to the product document in MongoDB.
//
// ENDPOINT: PUT /api/product/:id/pricing
//
// BODY PARAMS:
//   - selling_price:    (optional) new selling price — updates the actual menu price
//   - suggested_price:  (optional) store the analytics-recommended price for reference
//   - max_discount_pct: (optional) the max discount % — used by combo generator
//   - min_price:        (optional) the floor price below which we shouldn't go
//
// VALIDATION: selling_price must be >= cost (prevents negative margin)
const applyPricing = async (req, res) => {
    try {
        const { id } = req.params;
        const { selling_price, suggested_price, max_discount_pct, min_price } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Build update object — only include fields that were provided
        const updates = {};
        if (selling_price !== undefined) {
            // Guard: never allow price below cost (would mean selling at a loss)
            if (selling_price < product.cost) {
                return res.status(400).json({ success: false, message: "Selling price cannot be less than cost" });
            }
            updates.selling_price = Number(selling_price);
        }
        if (suggested_price !== undefined) updates.suggested_price = Number(suggested_price);
        // max_discount_pct is stored on the product so that generateSmartCombos()
        // can read it when computing combo discounts (instead of using hardcoded 10%/12%)
        if (max_discount_pct !== undefined) updates.max_discount_pct = Number(max_discount_pct);
        if (min_price !== undefined) updates.min_price = Number(min_price);

        const updated = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });

        return res.status(200).json({
            success: true,
            message: "Pricing updated successfully",
            data: updated,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { generateSmartCombos, getProductAnalytics, getAssociationRules, getSuggestions, getComboAnalytics, getPricingRecommendations, applyPricing };
