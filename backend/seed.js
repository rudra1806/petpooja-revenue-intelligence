require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./src/models/product.model.js");
const Order = require("./src/models/order.model.js");
const Combo = require("./src/models/combo.model.js");

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

const productsData = [
    // ── MAIN (8) ──
    {
        name: "Classic Burger",
        category: "main",
        selling_price: 180,
        cost: 70,
        description: "Juicy grilled patty with lettuce, tomato, and signature sauce",
        recommendation_score: 92,
        rating: 4.5,
        modifiers: [
            { name: "size", options: [{ value: "regular", extra_price: 0 }, { value: "large", extra_price: 40 }] },
            { name: "extra_cheese", options: [{ value: "no", extra_price: 0 }, { value: "yes", extra_price: 30 }] },
        ],
    },
    {
        name: "Margherita Pizza",
        category: "main",
        selling_price: 250,
        cost: 95,
        description: "Classic pizza with mozzarella, basil, and tomato sauce",
        recommendation_score: 90,
        rating: 4.6,
        modifiers: [
            { name: "size", options: [{ value: "medium", extra_price: 0 }, { value: "large", extra_price: 60 }] },
            { name: "extra_cheese", options: [{ value: "no", extra_price: 0 }, { value: "yes", extra_price: 40 }] },
        ],
    },
    {
        name: "Penne Pasta",
        category: "main",
        selling_price: 220,
        cost: 80,
        description: "Penne in creamy white sauce with herbs and mushrooms",
        recommendation_score: 78,
        rating: 4.2,
        modifiers: [
            { name: "spice_level", options: [{ value: "mild", extra_price: 0 }, { value: "medium", extra_price: 0 }, { value: "spicy", extra_price: 0 }] },
        ],
    },
    {
        name: "Grilled Sandwich",
        category: "main",
        selling_price: 150,
        cost: 55,
        description: "Toasted sandwich with veggies, cheese, and pesto spread",
        recommendation_score: 72,
        rating: 4.0,
        modifiers: [
            { name: "extra_cheese", options: [{ value: "no", extra_price: 0 }, { value: "yes", extra_price: 25 }] },
        ],
    },
    {
        name: "Chicken Wrap",
        category: "main",
        selling_price: 200,
        cost: 85,
        description: "Tortilla wrap with grilled chicken, lettuce, and ranch dressing",
        recommendation_score: 80,
        rating: 4.3,
        modifiers: [
            { name: "spice_level", options: [{ value: "mild", extra_price: 0 }, { value: "medium", extra_price: 0 }, { value: "spicy", extra_price: 0 }] },
        ],
    },
    {
        name: "Paneer Tikka Wrap",
        category: "main",
        selling_price: 190,
        cost: 75,
        description: "Smoky paneer tikka in a soft wrap with mint chutney",
        recommendation_score: 76,
        rating: 4.1,
        modifiers: [
            { name: "spice_level", options: [{ value: "mild", extra_price: 0 }, { value: "medium", extra_price: 0 }, { value: "spicy", extra_price: 0 }] },
        ],
    },
    {
        name: "Veggie Burger",
        category: "main",
        selling_price: 160,
        cost: 60,
        description: "Crispy veggie patty with coleslaw and tangy mayo",
        recommendation_score: 70,
        rating: 4.0,
        modifiers: [
            { name: "size", options: [{ value: "regular", extra_price: 0 }, { value: "large", extra_price: 35 }] },
            { name: "extra_cheese", options: [{ value: "no", extra_price: 0 }, { value: "yes", extra_price: 30 }] },
        ],
    },
    {
        name: "Pepperoni Pizza",
        category: "main",
        selling_price: 300,
        cost: 120,
        description: "Loaded with pepperoni, mozzarella, and oregano",
        recommendation_score: 88,
        rating: 4.5,
        modifiers: [
            { name: "size", options: [{ value: "medium", extra_price: 0 }, { value: "large", extra_price: 70 }] },
            { name: "extra_cheese", options: [{ value: "no", extra_price: 0 }, { value: "yes", extra_price: 40 }] },
        ],
    },

    // ── SNACKS (5) ──
    {
        name: "French Fries",
        category: "snack",
        selling_price: 100,
        cost: 30,
        description: "Crispy golden fries seasoned with salt and herbs",
        recommendation_score: 88,
        rating: 4.4,
        modifiers: [
            { name: "size", options: [{ value: "small", extra_price: 0 }, { value: "medium", extra_price: 20 }, { value: "large", extra_price: 40 }] },
        ],
    },
    {
        name: "Chicken Nuggets",
        category: "snack",
        selling_price: 140,
        cost: 50,
        description: "6 pieces of golden-fried chicken nuggets with dipping sauce",
        recommendation_score: 82,
        rating: 4.3,
        modifiers: [
            { name: "size", options: [{ value: "6pc", extra_price: 0 }, { value: "9pc", extra_price: 50 }] },
        ],
    },
    {
        name: "Garlic Bread",
        category: "snack",
        selling_price: 120,
        cost: 35,
        description: "Toasted bread with garlic butter and herbs",
        recommendation_score: 84,
        rating: 4.4,
        modifiers: [
            { name: "extra_cheese", options: [{ value: "no", extra_price: 0 }, { value: "yes", extra_price: 25 }] },
        ],
    },
    {
        name: "Onion Rings",
        category: "snack",
        selling_price: 110,
        cost: 35,
        description: "Crispy battered onion rings served with ketchup",
        recommendation_score: 68,
        rating: 3.9,
        modifiers: [],
    },
    {
        name: "Mozzarella Sticks",
        category: "snack",
        selling_price: 150,
        cost: 50,
        description: "Fried mozzarella sticks with marinara dip",
        recommendation_score: 74,
        rating: 4.1,
        modifiers: [],
    },

    // ── DESSERTS (5) ──
    {
        name: "Chocolate Brownie",
        category: "dessert",
        selling_price: 130,
        cost: 40,
        description: "Warm fudgy brownie with chocolate sauce",
        recommendation_score: 86,
        rating: 4.5,
        modifiers: [
            { name: "add_scoop", options: [{ value: "no", extra_price: 0 }, { value: "vanilla", extra_price: 40 }, { value: "chocolate", extra_price: 40 }] },
        ],
    },
    {
        name: "Vanilla Ice Cream",
        category: "dessert",
        selling_price: 90,
        cost: 25,
        description: "Two scoops of classic vanilla ice cream",
        recommendation_score: 80,
        rating: 4.3,
        modifiers: [
            { name: "topping", options: [{ value: "none", extra_price: 0 }, { value: "chocolate_syrup", extra_price: 20 }, { value: "sprinkles", extra_price: 15 }] },
        ],
    },
    {
        name: "New York Cheesecake",
        category: "dessert",
        selling_price: 180,
        cost: 65,
        description: "Creamy baked cheesecake with berry compote",
        recommendation_score: 78,
        rating: 4.4,
        modifiers: [],
    },
    {
        name: "Gulab Jamun",
        category: "dessert",
        selling_price: 80,
        cost: 20,
        description: "Soft milk-based dumplings soaked in rose-flavored syrup",
        recommendation_score: 72,
        rating: 4.2,
        modifiers: [],
    },
    {
        name: "Chocolate Mousse",
        category: "dessert",
        selling_price: 150,
        cost: 50,
        description: "Rich dark chocolate mousse topped with whipped cream",
        recommendation_score: 76,
        rating: 4.3,
        modifiers: [],
    },

    // ── BEVERAGES (7) ──
    {
        name: "Coke",
        category: "beverages",
        selling_price: 50,
        cost: 15,
        description: "Chilled Coca-Cola",
        recommendation_score: 90,
        rating: 4.2,
        modifiers: [
            { name: "size", options: [{ value: "small", extra_price: 0 }, { value: "medium", extra_price: 10 }, { value: "large", extra_price: 20 }] },
        ],
    },
    {
        name: "Mango Lassi",
        category: "beverages",
        selling_price: 80,
        cost: 25,
        description: "Thick creamy mango yogurt drink",
        recommendation_score: 82,
        rating: 4.4,
        modifiers: [],
    },
    {
        name: "Cold Coffee",
        category: "beverages",
        selling_price: 120,
        cost: 35,
        description: "Blended iced coffee with milk and cream",
        recommendation_score: 84,
        rating: 4.3,
        modifiers: [
            { name: "size", options: [{ value: "regular", extra_price: 0 }, { value: "large", extra_price: 30 }] },
        ],
    },
    {
        name: "Fresh Lemonade",
        category: "beverages",
        selling_price: 60,
        cost: 15,
        description: "Freshly squeezed lemon with mint and soda",
        recommendation_score: 78,
        rating: 4.1,
        modifiers: [
            { name: "sweetness", options: [{ value: "regular", extra_price: 0 }, { value: "less_sugar", extra_price: 0 }] },
        ],
    },
    {
        name: "Masala Chai",
        category: "beverages",
        selling_price: 40,
        cost: 10,
        description: "Traditional Indian spiced tea with milk",
        recommendation_score: 70,
        rating: 4.0,
        modifiers: [],
    },
    {
        name: "Mojito",
        category: "beverages",
        selling_price: 100,
        cost: 30,
        description: "Refreshing virgin mojito with lime and mint",
        recommendation_score: 76,
        rating: 4.2,
        modifiers: [],
    },
    {
        name: "Chocolate Milkshake",
        category: "beverages",
        selling_price: 130,
        cost: 40,
        description: "Thick and creamy chocolate milkshake",
        recommendation_score: 80,
        rating: 4.4,
        modifiers: [
            { name: "size", options: [{ value: "regular", extra_price: 0 }, { value: "large", extra_price: 30 }] },
        ],
    },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickModifiers(product) {
    if (!product.modifiers || product.modifiers.length === 0) return [];
    const selected = [];
    for (const mod of product.modifiers) {
        if (Math.random() < 0.5) {
            const option = pick(mod.options);
            selected.push({ name: mod.name, value: option.value, extra_price: option.extra_price });
        }
    }
    return selected;
}

function calcItemPrice(product, mods) {
    return product.selling_price + mods.reduce((sum, m) => sum + m.extra_price, 0);
}

// ─── ORDER PATTERNS (weighted for Apriori detection) ─────────────────────────

// Each pattern is [productNames[], weight]
// Higher weight = more frequent in orders
function getPatterns() {
    return [
        // HIGH frequency combos (Apriori should detect these easily)
        { items: ["Classic Burger", "French Fries", "Coke"], weight: 30 },
        { items: ["Margherita Pizza", "Garlic Bread", "Cold Coffee"], weight: 22 },
        { items: ["Margherita Pizza", "Garlic Bread", "Coke"], weight: 18 },
        { items: ["Classic Burger", "Coke"], weight: 16 },
        { items: ["Penne Pasta", "Fresh Lemonade"], weight: 14 },
        { items: ["Classic Burger", "Mango Lassi"], weight: 12 },
        { items: ["Pepperoni Pizza", "Coke", "French Fries"], weight: 12 },

        // MEDIUM frequency 
        { items: ["Chicken Wrap", "French Fries", "Coke"], weight: 10 },
        { items: ["Grilled Sandwich", "Fresh Lemonade"], weight: 9 },
        { items: ["Veggie Burger", "French Fries", "Fresh Lemonade"], weight: 8 },
        { items: ["Classic Burger", "French Fries", "Chocolate Milkshake"], weight: 8 },
        { items: ["Chicken Nuggets", "French Fries", "Coke"], weight: 8 },
        { items: ["Paneer Tikka Wrap", "Mango Lassi"], weight: 7 },
        { items: ["Margherita Pizza", "Garlic Bread", "Mojito"], weight: 7 },
        { items: ["Penne Pasta", "Garlic Bread", "Cold Coffee"], weight: 7 },

        // LOW frequency (variety / noise)
        { items: ["Classic Burger", "Onion Rings", "Coke"], weight: 5 },
        { items: ["Chocolate Brownie", "Vanilla Ice Cream"], weight: 5 },
        { items: ["New York Cheesecake", "Masala Chai"], weight: 4 },
        { items: ["Pepperoni Pizza", "Mozzarella Sticks", "Coke"], weight: 4 },
        { items: ["Grilled Sandwich", "Masala Chai"], weight: 4 },
        { items: ["Chicken Wrap", "Cold Coffee"], weight: 3 },
        { items: ["Gulab Jamun", "Masala Chai"], weight: 3 },
        { items: ["Chocolate Mousse", "Cold Coffee"], weight: 3 },
        { items: ["Veggie Burger", "Mango Lassi"], weight: 3 },
        { items: ["Pepperoni Pizza", "Garlic Bread", "Cold Coffee"], weight: 3 },
    ];
}

// ─── GENERATE ORDERS ─────────────────────────────────────────────────────────

function generateOrders(productMap, count) {
    const patterns = getPatterns();
    const totalWeight = patterns.reduce((s, p) => s + p.weight, 0);

    // Build weighted pool
    const pool = [];
    for (const p of patterns) {
        for (let i = 0; i < p.weight; i++) {
            pool.push(p.items);
        }
    }

    const channels = ["voice", "app", "counter"];
    const channelWeights = [0.25, 0.50, 0.25]; // app is most common

    const orders = [];

    for (let i = 1; i <= count; i++) {
        const patternItems = pick(pool);

        // Pick channel weighted
        const r = Math.random();
        let channel;
        if (r < channelWeights[0]) channel = "voice";
        else if (r < channelWeights[0] + channelWeights[1]) channel = "app";
        else channel = "counter";

        const items = [];
        let totalPrice = 0;

        for (const itemName of patternItems) {
            const product = productMap[itemName];
            if (!product) continue;

            const quantity = Math.random() < 0.1 ? 2 : 1; // 10% chance of qty 2
            const selectedMods = pickModifiers(product);
            const unitPrice = calcItemPrice(product, selectedMods);

            items.push({
                product_id: product._id,
                name: product.name,
                quantity,
                base_price: product.selling_price,
                selected_modifiers: selectedMods,
            });

            totalPrice += unitPrice * quantity;
        }

        // Occasionally add a random extra item (20% of orders)
        if (Math.random() < 0.2) {
            const allProducts = Object.values(productMap);
            const extra = pick(allProducts);
            const mods = pickModifiers(extra);
            items.push({
                product_id: extra._id,
                name: extra.name,
                quantity: 1,
                base_price: extra.selling_price,
                selected_modifiers: mods,
            });
            totalPrice += calcItemPrice(extra, mods);
        }

        const totalItems = items.reduce((s, it) => s + it.quantity, 0);
        const discount = Math.random() < 0.15 ? Math.round(totalPrice * pick([0.05, 0.10, 0.15])) : 0;
        const finalPrice = totalPrice - discount;

        orders.push({
            order_id: `ORD-${String(i).padStart(4, "0")}`,
            order_channel: channel,
            items,
            combos: [],
            total_items: totalItems,
            total_price: totalPrice,
            discount,
            final_price: finalPrice,
            order_score: parseFloat((Math.random() * 40 + 60).toFixed(1)), // 60-100
            rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),        // 3.0-5.0
        });
    }

    return orders;
}

// ─── GENERATE COMBOS ─────────────────────────────────────────────────────────

function generateCombos(productMap) {
    const comboDefs = [
        {
            combo_name: "Burger Blast Combo",
            items: ["Classic Burger", "French Fries", "Coke"],
            discount_pct: 0.12,
            support: 0.15,
            confidence: 0.72,
        },
        {
            combo_name: "Pizza Party Combo",
            items: ["Margherita Pizza", "Garlic Bread", "Cold Coffee"],
            discount_pct: 0.10,
            support: 0.11,
            confidence: 0.68,
        },
        {
            combo_name: "Pizza Classic Combo",
            items: ["Margherita Pizza", "Garlic Bread", "Coke"],
            discount_pct: 0.10,
            support: 0.09,
            confidence: 0.65,
        },
        {
            combo_name: "Pepperoni Feast Combo",
            items: ["Pepperoni Pizza", "French Fries", "Coke"],
            discount_pct: 0.10,
            support: 0.06,
            confidence: 0.60,
        },
        {
            combo_name: "Snack Attack Combo",
            items: ["Chicken Nuggets", "French Fries", "Coke"],
            discount_pct: 0.15,
            support: 0.04,
            confidence: 0.58,
        },
        {
            combo_name: "Wrap Meal Combo",
            items: ["Chicken Wrap", "French Fries", "Coke"],
            discount_pct: 0.10,
            support: 0.05,
            confidence: 0.55,
        },
        {
            combo_name: "Veggie Delight Combo",
            items: ["Veggie Burger", "French Fries", "Fresh Lemonade"],
            discount_pct: 0.12,
            support: 0.04,
            confidence: 0.52,
        },
        {
            combo_name: "Pasta Lover Combo",
            items: ["Penne Pasta", "Garlic Bread", "Cold Coffee"],
            discount_pct: 0.10,
            support: 0.03,
            confidence: 0.50,
        },
        {
            combo_name: "Dessert Duo",
            items: ["Chocolate Brownie", "Vanilla Ice Cream"],
            discount_pct: 0.10,
            support: 0.025,
            confidence: 0.48,
        },
        {
            combo_name: "Desi Snack Combo",
            items: ["Paneer Tikka Wrap", "Mango Lassi", "Gulab Jamun"],
            discount_pct: 0.12,
            support: 0.03,
            confidence: 0.45,
        },
    ];

    return comboDefs.map((def) => {
        const comboItems = def.items.map((name) => {
            const p = productMap[name];
            return {
                product_id: p._id,
                name: p.name,
                quantity: 1,
                base_price: p.selling_price,
            };
        });

        const totalSelling = comboItems.reduce((s, it) => s + it.base_price, 0);
        const totalCost = def.items.reduce((s, name) => s + productMap[name].cost, 0);
        const discountAmt = Math.round(totalSelling * def.discount_pct);
        const comboPrice = totalSelling - discountAmt;

        // combo_score = 0.4 × confidence + 0.3 × profit_ratio + 0.3 × demand(support*100)
        const profitRatio = (comboPrice - totalCost) / comboPrice;
        const comboScore = parseFloat(
            (0.4 * def.confidence + 0.3 * profitRatio + 0.3 * (def.support * 100) / 15).toFixed(3)
        );

        return {
            combo_name: def.combo_name,
            items: comboItems,
            total_selling_price: totalSelling,
            combo_price: comboPrice,
            discount: discountAmt,
            total_cost: totalCost,
            support: def.support,
            confidence: def.confidence,
            combo_score: comboScore,
            rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        };
    });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");

        // Clear existing data
        await Product.deleteMany({});
        await Order.deleteMany({});
        await Combo.deleteMany({});
        console.log("Cleared existing data");

        // Insert products
        const products = await Product.insertMany(productsData);
        console.log(`Inserted ${products.length} products`);

        // Build lookup map  name → product doc
        const productMap = {};
        for (const p of products) {
            productMap[p.name] = p;
        }

        // Generate & insert orders (250)
        const ordersData = generateOrders(productMap, 250);
        const orders = await Order.insertMany(ordersData);
        console.log(`Inserted ${orders.length} orders`);

        // Generate & insert combos
        const combosData = generateCombos(productMap);
        const combos = await Combo.insertMany(combosData);
        console.log(`Inserted ${combos.length} combos`);

        // Print a summary
        console.log("\n── Seed Summary ──");
        console.log(`Products: ${products.length}`);
        console.log(`Orders:   ${orders.length}`);
        console.log(`Combos:   ${combos.length}`);

        // Print top patterns by frequency
        const patternCount = {};
        for (const order of ordersData) {
            const key = order.items.map((i) => i.name).sort().join(" + ");
            patternCount[key] = (patternCount[key] || 0) + 1;
        }
        const sorted = Object.entries(patternCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
        console.log("\nTop 10 order patterns:");
        sorted.forEach(([k, v], i) => console.log(`  ${i + 1}. ${k} (${v} orders)`));

        await mongoose.disconnect();
        console.log("\nDone. Disconnected.");
        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    }
}

seed();
