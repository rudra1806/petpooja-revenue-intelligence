# PetPooja — Revenue Intelligence Platform

A full-stack restaurant analytics platform that uses **association rule mining**, **product profitability classification**, and **smart combo generation** to help restaurant owners maximise revenue, design data-driven combo meals, and surface real-time upsell recommendations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Core Analytics Functions](#core-analytics-functions)
   - [computeProductAnalytics](#1-computeproductanalytics)
   - [computeAssociationRules](#2-computeassociationrules)
   - [generateSmartCombos](#3-generatesmartcombos)
   - [getComboAnalytics](#4-getcomboanalytics)
   - [getSuggestions (Upsell Engine)](#5-getsuggestions-upsell-engine)
7. [Helper Functions](#helper-functions)
   - [areCuisinesCompatible](#arecuisinescompatible)
   - [getCompatibilityScore](#getcompatibilityscore)
8. [Equations & Scoring Formulas](#equations--scoring-formulas)
9. [Category Compatibility Matrix](#category-compatibility-matrix)
10. [Product Classification Matrix](#product-classification-matrix)
11. [Frontend Pages](#frontend-pages)
12. [CRUD Controllers](#crud-controllers)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌───────────┬───────────┬───────────┬───────────┐          │
│  │ Analytics │  Combos   │  Manage   │  Upsell   │          │
│  │   Page    │ Generator │  Combos   │   View    │          │
│  └─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘          │
│        │           │           │           │                │
│        └───────────┴───────────┴───────────┘                │
│                        │  REST API calls                    │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│               Backend (Express.js)                          │
│  ┌──────────────────────────────────────────┐               │
│  │         Analytics Controller             │               │
│  │  ┌──────────────┐  ┌─────────────────┐   │               │
│  │  │  Product      │  │  Association    │   │               │
│  │  │  Analytics    │  │  Rule Mining    │   │               │
│  │  └──────┬───────┘  └───────┬─────────┘   │               │
│  │         │                  │              │               │
│  │  ┌──────┴──────────────────┴──────────┐   │               │
│  │  │  Smart Combo Generator             │   │               │
│  │  │  Upsell Suggestion Engine          │   │               │
│  │  │  Combo Analytics                   │   │               │
│  │  └────────────────────────────────────┘   │               │
│  └──────────────────────────────────────────┘               │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   MongoDB Atlas     │
              │  ┌───────────────┐  │
              │  │  Products     │  │
              │  │  Orders       │  │
              │  │  Combos       │  │
              │  └───────────────┘  │
              └─────────────────────┘
```

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite 7, CSS3              |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB Atlas (Mongoose ODM)        |
| Analytics  | Custom association mining engine     |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas cluster (or local MongoDB)

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<dbname>
PORT=3001
GEMINI_API_KEY=<your-key>
```

Start the server:

```bash
node index.js
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and calls the backend at `http://localhost:3001/api`.

---

## Database Models

### Product

| Field                | Type       | Description                                       |
|----------------------|------------|---------------------------------------------------|
| `name`               | String     | Product name (required)                           |
| `category`           | Enum       | `main`, `snack`, `dessert`, `beverages` (required)|
| `selling_price`      | Number     | Menu price shown to customer (required)           |
| `cost`               | Number     | Raw cost to produce the item (required)           |
| `description`        | String     | Optional product description                     |
| `recommendation_score`| Number    | Algorithm-generated recommendation score          |
| `rating`             | Number     | Average customer rating                           |
| `modifiers`          | Array      | Add-on options (e.g. size, extra cheese)          |

**Indexes:** `{ category: 1 }`

### Order

| Field           | Type       | Description                                        |
|-----------------|------------|----------------------------------------------------|
| `order_id`      | String     | Unique order identifier (required, unique)         |
| `order_channel` | Enum       | `voice`, `app`, `counter` (required)               |
| `items`         | Array      | List of ordered products with quantity & price      |
| `combos`        | Array      | List of ordered combos                             |
| `total_items`   | Number     | Total number of items in the order                 |
| `total_price`   | Number     | Sum of all item prices before discount             |
| `discount`      | Number     | Discount applied                                   |
| `final_price`   | Number     | Amount charged to customer                         |

**Indexes:** `{ "items.product_id": 1 }`

### Combo

| Field                | Type       | Description                                       |
|----------------------|------------|---------------------------------------------------|
| `combo_name`         | String     | Display name for the combo (required)             |
| `description`        | String     | Auto-generated reasoning                          |
| `items`              | Array      | Products in the combo (product_id, name, qty, price)|
| `total_selling_price`| Number     | Sum of individual item prices (required)          |
| `combo_price`        | Number     | Discounted combo price (required)                 |
| `discount`           | Number     | Absolute discount amount                          |
| `total_cost`         | Number     | Sum of item costs                                 |
| `support`            | Number     | Association rule support value                    |
| `confidence`         | Number     | Association rule confidence value                 |
| `combo_score`        | Number     | Weighted composite score                          |
| `rating`             | Number     | Customer rating                                   |

**Indexes:** `{ "items.product_id": 1 }`, `{ combo_score: -1 }`

---

## API Endpoints

### Products

| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | `/api/product/add`   | Add a new product  |

### Orders

| Method | Endpoint           | Description       |
|--------|--------------------|--------------------|
| POST   | `/api/order/add`   | Add a new order   |

### Combos & Analytics

| Method | Endpoint                           | Description                                      |
|--------|------------------------------------|--------------------------------------------------|
| POST   | `/api/combo/add`                   | Save a generated combo to DB                     |
| GET    | `/api/combo/all`                   | Get all saved combos (sorted by score desc)      |
| DELETE | `/api/combo/:id`                   | Delete a saved combo                             |
| GET    | `/api/combo/generate`              | Generate smart combos from order data            |
| GET    | `/api/combo/suggest/:productId`    | Get upsell suggestions for a specific product    |
| GET    | `/api/combo/analytics/combo/:comboId` | Deep analytics for a specific saved combo     |
| GET    | `/api/combo/analytics/products`    | Get profitability analytics for all products     |
| GET    | `/api/combo/analytics/associations`| Get all association rules from order data         |

---

## Core Analytics Functions

### 1. `computeProductAnalytics`

**Purpose:** Analyses every product in the database by computing profitability metrics and classifying each product into one of four strategic quadrants.

**Data Sources:** `Product` collection + `Order` collection

**Process:**

1. **Scan all orders** to build a sales map per product:
   - `unitsSold` — total quantity sold across all orders
   - `orderCount` — number of distinct orders containing the product
   - `revenue` — total revenue generated (`base_price × quantity`)

2. **Compute per-product metrics:**

   **Margin (absolute):**

   $$Margin = sellingPrice - cost$$

   **Margin Percentage:**

   $$Margin\% = \frac{sellingPrice - cost}{sellingPrice} \times 100$$

   **Order Frequency** — how often the product appears across orders:

   $$\text{Order Frequency} = \frac{\text{orderCount}}{\text{totalOrders}}$$

   **Revenue Share** — the product's contribution to total revenue:

   $$RevenueShare = \frac{productRevenue}{totalRevenue} \times 100$$

3. **Classify** into the BCG-inspired profitability matrix (see [Product Classification Matrix](#product-classification-matrix)).

**Output:** Array of product analytics objects with `margin`, `margin_pct`, `units_sold`, `order_frequency`, `revenue_share`, and `classification`.

---

### 2. `computeAssociationRules`

**Purpose:** Mines order history to discover which products are frequently bought together using association rule mining (Apriori-style pairwise analysis).

**Process:**

1. **Count single-item frequency** — for each product, how many orders contain it:

   $$\text{freq}(A) = \text{number of orders containing product A}$$

2. **Count pairwise co-occurrence** — for every unique pair of products in each order:

   $$\text{pairFreq}(A, B) = \text{number of orders containing both A and B}$$

3. **Compute three association metrics** for each pair:

   **Support** — the fraction of all orders that contain both items:

   $$\text{Support}(A, B) = \frac{\text{pairFreq}(A, B)}{\text{totalOrders}}$$

   > Support tells us how commonly this pair occurs overall. A support of 0.10 means 10% of all orders contain both items.

   **Confidence** — given one item was purchased, the probability the other was also purchased:

   $$\text{Confidence}(A \rightarrow B) = \frac{\text{pairFreq}(A, B)}{\text{freq}(A)}$$

   $$\text{Confidence}(B \rightarrow A) = \frac{\text{pairFreq}(A, B)}{\text{freq}(B)}$$

   The system takes the **maximum** of both directions:

   $$\text{Confidence} = \max\bigl(\text{Conf}(A \rightarrow B),\ \text{Conf}(B \rightarrow A)\bigr)$$

   > Confidence of 0.60 means "60% of buyers of item A also buy item B" (or vice versa, whichever is higher).

   **Lift** — how much more likely the pair is bought together compared to random chance:

   $$\text{Lift}(A, B) = \frac{\text{Support}(A, B)}{P(A) \times P(B)} = \frac{\text{pairFreq}(A,B) / \text{totalOrders}}{(\text{freq}(A)/\text{totalOrders}) \times (\text{freq}(B)/\text{totalOrders})}$$

   > - Lift > 1.0 → products are bought together **more** than expected by chance
   > - Lift = 1.0 → products are independent (no association)
   > - Lift < 1.0 → products are bought together **less** than expected (negative association)

4. **Filter:** Only pairs with `support >= 0.02` are kept (at least 2% of orders).

5. **Sort** by lift descending (strongest associations first).

---

### 3. `generateSmartCombos`

**Purpose:** Automatically generates profitable combo meal suggestions using two complementary strategies, then scores, deduplicates, and ranks them.

#### Strategy 1: Pattern-Based Combos

Uses association rules to build combos from products that customers already buy together.

**Filter criteria:**
- `confidence >= 0.3` (at least 30% co-purchase rate)
- `lift >= 1.0` (positive association)
- `compatibility_score >= 0.4` (culinary compatibility check)

**Beverage auto-addition:** If neither item in the pair is a beverage, the most frequently ordered beverage is added to the combo.

**Discount:** 10% off the total selling price:

$$\text{discountAmt} = \lfloor \text{totalSelling} \times 0.10 \rfloor$$

$$\text{comboPrice} = \text{totalSelling} - \text{discountAmt}$$

**Profit Margin:**

$$\text{profitMargin} = \frac{\text{comboPrice} - \text{totalCost}}{\text{comboPrice}}$$

**Combo Score (Pattern-Based):**

$$\text{ComboScore} = 0.30 \times \text{associationScore} + 0.25 \times \text{profitScore} + 0.20 \times \text{strategicBoost} + 0.15 \times \text{compatScore} + 0.10 \times \text{diversityBonus}$$

Where each component is:

| Component          | Formula                                                                 | Range  | Weight |
|--------------------|-------------------------------------------------------------------------|--------|--------|
| **associationScore** | $\min\bigl(1,\ \frac{\text{lift}}{3} \times \text{confidence}\bigr)$  | 0 – 1  | 0.30   |
| **profitScore**      | $\min(1,\ \text{profitMargin})$                                       | 0 – 1  | 0.25   |
| **strategicBoost**   | 1.0 if combo contains a hidden gem, else 0.4                          | 0.4 / 1| 0.20   |
| **compatScore**      | Output of `getCompatibilityScore()` (see [Helper Functions](#helper-functions)) | 0 – 1 | 0.15 |
| **diversityBonus**   | 1.0 if ≥ 3 categories, 0.6 if 2 categories, 0.2 if 1 category        | 0.2 – 1| 0.10   |

#### Strategy 2: Hidden Gem Boost Combos

Pairs high-margin, low-frequency products ("hidden gems") with popular, high-margin products ("stars") to increase the hidden gem's visibility.

**Selection logic:**
- Pick each hidden gem product
- Pair it with each star product from a **different** category
- Add the highest-margin beverage if neither is a beverage
- Require `compatibility_score >= 0.5`

**Discount:** 12% off the total selling price:

$$\text{discountAmt} = \lfloor \text{totalSelling} \times 0.12 \rfloor$$

**Combo Score (Hidden Gem Boost):**

$$\text{ComboScore} = 0.30 \times 0.3 + 0.25 \times \min(1, \text{profitMargin}) + 0.20 \times 1.0 + 0.15 \times \text{compatScore} + 0.10 \times \text{diversityBonus}$$

> Note: The association component is fixed at 0.3 (no order-history data for this pair), and the strategic boost is always 1.0 (always contains a hidden gem).

#### Final Output

- Deduplicate by product set (sorted product IDs)
- Sort all candidates by `combo_score` descending
- Return the **top 15** combos

---

### 4. `getComboAnalytics`

**Purpose:** Provides deep-dive analytics for a single saved combo, including profitability breakdown, per-item performance, and pairwise buying pattern analysis.

**Endpoint:** `GET /api/combo/analytics/combo/:comboId`

**Computed Metrics:**

**Combo Margin:**

$$comboMargin = comboPrice - \sum(itemCosts)$$

$$comboMarginPct = \frac{comboMargin}{comboPrice} \times 100$$

**Customer Savings:**

$$savings = totalSellingPrice - comboPrice$$

$$savingsPct = \frac{savings}{totalSellingPrice} \times 100$$

**Full Combo Order Rate** — how often all combo items appear together naturally in orders:

$$\text{fullComboRate} = \frac{\text{orders containing ALL combo items}}{\text{totalOrders}} \times 100$$

**Pairwise Affinity Labels:**

| Affinity Level | Criteria                                                  |
|----------------|-----------------------------------------------------------|
| Very Strong    | `lift >= 2.5` AND `max(confAB, confBA) >= 0.4`           |
| Strong         | `lift >= 1.5` AND `max(confAB, confBA) >= 0.3`           |
| Moderate       | `lift >= 1.0`                                             |
| Weak           | Everything else                                           |

**Output includes:**
- `overall` — combo margin, savings, compatibility score, full-combo order count
- `item_analytics` — per-item classification, margin, units sold, order frequency
- `pairwise_associations` — every item pair with times bought together, confidence A→B, confidence B→A, lift, and affinity label

---

### 5. `getSuggestions` (Upsell Engine)

**Purpose:** When a customer adds a specific product to their cart, this function recommends other individual items and existing combos that pair well with it, ranked by an upsell priority score.

**Endpoint:** `GET /api/combo/suggest/:productId`

**Process:**

1. **Find co-purchased items** from order history — scan all orders containing the target product and count co-occurrences of every other product.

2. **Compute per-suggestion metrics:**

   **Confidence:**

   $$\text{Confidence} = \frac{\text{coOccurrence}(target, other)}{\text{ordersContainingTarget}}$$

   **Lift:**

   $$\text{Lift} = \frac{\text{coOccurrence} / \text{totalOrders}}{(\text{targetOrders}/\text{totalOrders}) \times (\text{otherFreq}/\text{totalOrders})}$$

   **Compatibility Score:**

   $$\text{compatScore} = \begin{cases} \text{COMPATIBILITY}[catA][catB] & \text{if cuisines are compatible} \\ \text{COMPATIBILITY}[catA][catB] \times 0.3 & \text{if cross-cuisine} \end{cases}$$

   Items with `compatScore < 0.4` are filtered out.

   **Margin Percentage:**

   $$marginPct = \frac{sellingPrice - cost}{sellingPrice}$$

3. **Upsell Priority Score:**

   $$\text{UpsellScore} = 0.40 \times \text{confidence} + 0.25 \times \min(1, \text{marginPct}) + 0.20 \times \text{compatScore} + 0.15 \times \min\bigl(1, \frac{\text{lift}}{2}\bigr)$$

   | Component       | Weight | Rationale                                                 |
   |-----------------|--------|-----------------------------------------------------------|
   | Confidence      | 0.40   | How strongly this item is associated with the target      |
   | Margin          | 0.25   | Profitability — prefer high-margin upsells                |
   | Compatibility   | 0.20   | Culinary pairing quality                                  |
   | Lift (normed)   | 0.15   | Statistical strength of the buying affinity               |

4. **Generate human-readable insights** with tags:

   | Insight Tag      | Trigger                    |
   |------------------|----------------------------|
   | Strong Pattern   | `confidence >= 0.5`        |
   | Moderate Pattern | `confidence >= 0.3`        |
   | Strong Affinity  | `lift > 2.0`               |
   | Above Average    | `lift > 1.2`               |
   | High Margin      | `marginPct >= 70%`         |
   | Good Margin      | `marginPct >= 50%`         |
   | Low Margin       | `marginPct < 50%`          |

5. **Return top 10** individual suggestions + all matching saved combos containing the product.

---

## Helper Functions

### `areCuisinesCompatible`

**Purpose:** Prevents cross-cuisine pairing (e.g. Gulab Jamun + Pepperoni Pizza) unless one item is tagged as "universal".

**Logic:**
- Each product name maps to a cuisine tag: `western`, `italian`, `indian`, or `universal`
- If either item is `universal` → compatible (returns `true`)
- Otherwise, both must share the same cuisine tag

**Cuisine Tag Map:**

| Cuisine   | Products                                                        |
|-----------|-----------------------------------------------------------------|
| Western   | Classic Burger, Grilled Sandwich, Chicken Wrap, Veggie Burger, New York Cheesecake |
| Italian   | Margherita Pizza, Penne Pasta, Pepperoni Pizza                  |
| Indian    | Paneer Tikka Wrap, Gulab Jamun, Mango Lassi, Masala Chai        |
| Universal | French Fries, Chicken Nuggets, Garlic Bread, Onion Rings, Mozzarella Sticks, Chocolate Brownie, Vanilla Ice Cream, Chocolate Mousse, Coke, Cold Coffee, Fresh Lemonade, Mojito, Chocolate Milkshake |

---

### `getCompatibilityScore`

**Purpose:** Calculates an average culinary compatibility score for a set of products based on their category pairings and cuisine tags.

**Algorithm:**

1. Generate all unique pairs from the product set
2. For each pair:
   - Look up the category compatibility from the [Compatibility Matrix](#category-compatibility-matrix)
   - Check cuisine compatibility via `areCuisinesCompatible`
   - If cuisines are incompatible, multiply the score by 0.3 (penalty)
3. Return the average score across all pairs:

$$\text{CompatibilityScore} = \frac{\sum_{(i,j)} S_{ij}}{|\text{pairs}|}$$

Where:

$$S_{ij} = \begin{cases} \text{COMPATIBILITY}[\text{cat}_i][\text{cat}_j] & \text{if cuisines compatible} \\ \text{COMPATIBILITY}[\text{cat}_i][\text{cat}_j] \times 0.3 & \text{otherwise} \end{cases}$$

---

## Equations & Scoring Formulas

### Summary of All Equations

| # | Equation | Used In |
|---|----------|---------|
| 1 | $\text{Margin} = \text{price} - \text{cost}$ | Product Analytics |
| 2 | $\text{Margin\%} = \frac{\text{price} - \text{cost}}{\text{price}} \times 100$ | Product Analytics |
| 3 | $\text{Order Frequency} = \frac{\text{orderCount}}{\text{totalOrders}}$ | Product Analytics |
| 4 | $RevenueShare = \frac{productRevenue}{totalRevenue} \times 100$ | Product Analytics |
| 5 | $\text{Support}(A,B) = \frac{\text{pairFreq}(A,B)}{\text{totalOrders}}$ | Association Mining |
| 6 | $\text{Confidence}(A \to B) = \frac{\text{pairFreq}(A,B)}{\text{freq}(A)}$ | Association Mining |
| 7 | $\text{Lift}(A,B) = \frac{\text{Support}(A,B)}{P(A) \times P(B)}$ | Association Mining |
| 8 | $\text{ComboScore} = 0.30 \cdot A + 0.25 \cdot P + 0.20 \cdot S + 0.15 \cdot C + 0.10 \cdot D$ | Combo Generator |
| 9 | $\text{UpsellScore} = 0.40 \cdot \text{conf} + 0.25 \cdot \text{margin} + 0.20 \cdot \text{compat} + 0.15 \cdot \text{lift}$ | Upsell Engine |
| 10 | $\text{CompatScore} = \frac{1}{n} \sum S_{ij}$ | Combo Compatibility |
| 11 | $\text{comboMarginPct} = \frac{\text{comboPrice} - \text{totalCost}}{\text{comboPrice}} \times 100$ | Combo Analytics |
| 12 | $\text{savingsPct} = \frac{\text{totalSelling} - \text{comboPrice}}{\text{totalSelling}} \times 100$ | Combo Analytics |
| 13 | $\text{fullComboRate} = \frac{\text{ordersWithAllItems}}{\text{totalOrders}} \times 100$ | Combo Analytics |

---

## Category Compatibility Matrix

Scores range from 0 to 1, indicating how well two food categories pair together. Used to prevent nonsensical combos.

|              | Main  | Snack | Dessert | Beverages |
|--------------|-------|-------|---------|-----------|
| **Main**     | 0.20  | 0.90  | 0.50    | 0.95      |
| **Snack**    | 0.90  | 0.30  | 0.40    | 0.90      |
| **Dessert**  | 0.30  | 0.40  | 0.20    | 0.80      |
| **Beverages**| 0.95  | 0.90  | 0.80    | 0.20      |

**Key observations:**
- Same-category pairing is penalised (0.2–0.3) — two mains or two beverages don't make a good combo
- **Main + Beverages** (0.95) is the strongest pairing
- **Main + Snack** (0.90) is a natural meal combo
- **Dessert + Beverages** (0.80) is a solid post-meal pairing

---

## Product Classification Matrix

Products are classified using a **BCG-inspired 2×2 matrix** based on margin percentage and order frequency.

```
                    ┌─────────────────────────────────────────┐
                    │        Order Frequency                  │
                    │     Low (< 15%)     High (>= 15%)       │
          ┌─────────┼────────────────────┬────────────────────┤
 Margin   │ High    │   HIDDEN GEM       │      STAR          │
 (>= 50%) │         │   High profit,     │   High profit,     │
          │         │   low visibility   │   high demand      │
          ├─────────┼────────────────────┼────────────────────┤
 Margin   │ Low     │      DOG           │   VOLUME TRAP      │
 (< 50%)  │         │   Low profit,      │   High demand but  │
          │         │   low demand       │   low profit       │
          └─────────┴────────────────────┴────────────────────┘
```

| Classification | Margin % | Order Frequency | Strategy                              |
|----------------|----------|-----------------|---------------------------------------|
| **Star**       | ≥ 50%    | ≥ 15%           | Promote heavily, feature in combos    |
| **Hidden Gem** | ≥ 50%    | < 15%           | Boost visibility by pairing with stars|
| **Volume Trap**| < 50%    | ≥ 15%           | Raise price or pair with high-margin items|
| **Dog**        | < 50%    | < 15%           | Consider discontinuing or repositioning|

**Thresholds used:**
- Median margin: **50%**
- Median order frequency: **0.15** (15% of orders)

---

## Frontend Pages

### 1. ProductAnalytics

Displays the profitability matrix for all products. Each product shows:
- Margin percentage and absolute margin
- Units sold and order frequency
- Revenue share
- BCG classification badge (Star, Hidden Gem, Volume Trap, Dog)
- Visual score bar (green/yellow/red based on thresholds)

### 2. ComboGenerator

Calls the smart combo generation endpoint and displays AI-generated combo suggestions with:
- Combo name and description
- Strategy label (Pattern-Based or Hidden Gem Boost)
- Items list with individual prices
- Combo score, support, confidence, lift
- Profit margin bar
- Combo price with discount breakdown
- "Save to DB" button

### 3. ManageCombos

Manages saved combos with:
- Overview statistics (total combos, avg discount, avg items/combo, avg score)
- Combo cards with all metadata
- "View Analytics" modal — calls `getComboAnalytics` to show profitability, per-item breakdown, and pairwise buying patterns
- Delete functionality with confirmation

### 4. SuggestView (Upsell)

Interactive upsell recommendation engine:
- Product selector to pick a base product
- Displays ranked individual item suggestions with:
  - Upsell score and confidence
  - Insight tags (Strong Pattern, High Margin, etc.)
  - Human-readable reasoning
- Shows matching saved combos containing the selected product
- Manual combo creation from the suggestions view

---

## CRUD Controllers

### `addProduct`

Creates a new product document. Requires `name`, `category`, `selling_price`, and `cost`.

### `addOrder`

Creates a new order document. Requires `order_id`, `order_channel`, `total_items`, `total_price`, and `final_price`. Rejects duplicate `order_id` values (HTTP 409).

### `addCombo`

Saves a generated combo to the database. Requires `combo_name`, `total_selling_price`, and `combo_price`.

### `getAllCombos`

Returns all saved combos sorted by `combo_score` descending.

### `deleteCombo`

Deletes a combo by its MongoDB `_id`. Returns 404 if not found.

---

## License

This project is proprietary and developed for the PetPooja Revenue Intelligence platform.
