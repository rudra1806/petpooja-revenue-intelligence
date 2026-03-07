# PetPooja — AI-Powered Restaurant Revenue Intelligence Platform

A full-stack restaurant management platform combining **revenue analytics**, **AI-powered ordering** (text, voice, and phone), **smart combo generation**, **dynamic pricing intelligence**, and **real-time upsell recommendations** — built for both restaurant owners and customers.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Core Analytics Engine](#core-analytics-engine)
   - [Product Analytics (BCG Classification)](#1-product-analytics-bcg-classification)
   - [Association Rule Mining](#2-association-rule-mining)
   - [Smart Combo Generator](#3-smart-combo-generator)
   - [Combo Deep Analytics](#4-combo-deep-analytics)
   - [Upsell Suggestion Engine](#5-upsell-suggestion-engine)
   - [Pricing Intelligence](#6-pricing-intelligence)
9. [Voice AI Assistant](#voice-ai-assistant)
   - [Order Parser](#order-parser)
   - [Menu Question AI](#menu-question-ai)
   - [Twilio Phone Integration](#twilio-phone-integration)
   - [Text-to-Speech (Sarvam AI)](#text-to-speech-sarvam-ai)
10. [Owner Dashboard (Frontend)](#owner-dashboard-frontend)
11. [User Dashboard (User Frontend)](#user-dashboard-user-frontend)
12. [Helper Functions](#helper-functions)
13. [Equations & Scoring Formulas](#equations--scoring-formulas)
14. [Category Compatibility Matrix](#category-compatibility-matrix)
15. [Product Classification Matrix](#product-classification-matrix)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│  ┌─────────────────────────┐         ┌──────────────────────────────────┐    │
│  │  Owner Dashboard        │         │  User Dashboard                  │    │
│  │  (React + Vite)         │         │  (React + Vite)                  │    │
│  │  http://localhost:5173  │         │  http://localhost:5174           │    │
│  ├─────────────────────────┤         ├──────────────────────────────────┤    │
│  │ • Product Analytics     │         │ • Menu Browser                   │    │
│  │ • Pricing Dashboard     │         │ • AI Chat Ordering               │    │
│  │ • Combo Generator       │         │ • Voice Ordering (Web Speech)    │    │
│  │ • Manage Combos         │         │ • Phone Ordering (Twilio)        │    │
│  │ • Upsell Suggestions    │         │ • My Orders (Session-based)      │    │
│  │ • Order Management      │         │                                  │    │
│  └────────┬────────────────┘         └────────┬───────────┬─────────────┘    │
│           │                                   │           │                  │
└───────────┼───────────────────────────────────┼───────────┼──────────────────┘
            │ REST API                          │           │ /parse-order
            │                                   │           │ /tts
┌───────────▼───────────────────┐    ┌──────────▼───────────▼──────────────────┐
│   Backend API Server          │    │   Voice AI Assistant                    │
│   (Express.js)                │    │   (Express.js)                          │
│   http://localhost:3001       │    │   http://localhost:3002                 │
│                               │    │                                         │
│   • Product CRUD              │    │   • Order Parsing (Fuse.js fuzzy match) │
│   • Order CRUD                │    │   • Session Management (MongoDB)        │
│   • Combo CRUD                │    │   • AI Menu Q&A (LLama 3 70B)           │
│   • Analytics Engine          │    │   • TTS (Sarvam AI bulbul:v3)           │
│   • Pricing Recommendations   │    │   • Twilio Voice Webhooks               │
│   • Association Mining        │    │                                         │
└───────────┬───────────────────┘    └──────┬───────────────┬──────────────────┘
            │                               │               │
            └───────────┬───────────────────┘               │
                        │                                   │
             ┌──────────▼──────────┐             ┌──────────▼───────────────┐
             │   MongoDB Atlas     │             │   External AI Services   │
             │                     │             │                          │
             │   • Products        │             │   • HuggingFace          │
             │   • Orders          │             │     (LLama 3 70B)        │
             │   • Combos          │             │   • LM Studio (fallback) │
             │   • Sessions        │             │   • Sarvam AI (TTS)      │
             └─────────────────────┘             │   • Twilio (Phone)       │
                                                 └──────────────────────────┘
```

---

## Tech Stack

| Layer               | Technology                                          |
|---------------------|-----------------------------------------------------|
| Owner Frontend      | React 19, Vite 7, CSS3, DM Sans + JetBrains Mono    |
| User Frontend       | React 19, Vite 7, CSS3, Web Speech API              |
| Backend API         | Node.js, Express 5, Mongoose 9                      |
| Voice AI Server     | Node.js, Express 5, Fuse.js 7, uuid                 |
| Database            | MongoDB Atlas (Mongoose ODM)                        |
| AI / NLP            | Meta-LLama 3 70B (HuggingFace), LM Studio (local)   |
| Text-to-Speech      | Sarvam AI (bulbul:v3, speaker: ritu, en-IN)         |
| Phone Integration   | Twilio Voice (TwiML, Speech-to-Text)                |
| Analytics           | Custom association rule mining, BCG classification  |

---

## Project Structure

```
hackamined/
├── README.md
├── aimodel/
│   └── t.py                              # Placeholder for offline ML model
│
├── backend/                               # REST API Server (Port 3001)
│   ├── index.js                           # Entry point — connects DB, starts server
│   ├── package.json
│   ├── seed.js                            # Database seeder
│   └── src/
│       ├── app.js                         # Express app — CORS, routes, health check
│       ├── config/
│       │   └── db.js                      # MongoDB connection (MONGO_URL)
│       ├── controllers/
│       │   ├── analytics.controller.js    # Core analytics engine (~970 lines)
│       │   ├── combo.controller.js        # Combo CRUD operations
│       │   ├── order.controller.js        # Order CRUD + session-based queries
│       │   └── product.controller.js      # Product CRUD + pricing application
│       ├── models/
│       │   ├── combo.model.js             # Combo schema (items, scores, pricing)
│       │   ├── order.model.js             # Order schema (items, combos, session_id)
│       │   └── product.model.js           # Product schema (pricing intelligence fields)
│       └── routes/
│           ├── combo.route.js             # /api/combo/* (CRUD + analytics)
│           ├── order.route.js             # /api/order/* (CRUD + session filter)
│           └── product.route.js           # /api/product/* (CRUD + pricing)
│
├── frontend/                              # Owner Dashboard (Port 5173)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                        # Tab navigation (6 tabs)
│       ├── index.css                      # Design system — DM Sans + JetBrains Mono
│       ├── main.jsx
│       └── pages/
│           ├── ProductAnalytics.jsx       # BCG quadrant classification view
│           ├── PricingDashboard.jsx       # Dynamic pricing recommendations
│           ├── ComboGenerator.jsx         # AI combo generation + save to DB
│           ├── ManageCombos.jsx           # Manage saved combos + deep analytics
│           ├── SuggestView.jsx            # Upsell suggestion engine
│           └── Orders.jsx                 # Order management (CRUD table)
│
├── user-frontend/                         # User Dashboard (Port 5174)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js                     # Dev server port: 5174
│   └── src/
│       ├── App.jsx                        # Tab navigation (5 tabs) + session management
│       ├── index.css                      # Design system — matches owner dashboard
│       ├── main.jsx
│       └── pages/
│           ├── Menu.jsx                   # Browse products & combos (category filter)
│           ├── ChatOrder.jsx              # AI text-based ordering via /parse-order
│           ├── VoiceOrder.jsx             # Voice ordering (Web Speech API + Sarvam TTS)
│           ├── CallOrder.jsx              # Phone ordering (Twilio call link)
│           └── MyOrders.jsx               # Order history by session ID
│
├── voice-ai-assistant/                    # Voice AI Server (Port 3002)
│   ├── server.js                          # Entry point — Express, CORS, routes, /tts
│   ├── package.json
│   ├── probe-lm.js                        # LM Studio connectivity probe
│   ├── test-sarvam.js                     # Sarvam TTS test script
│   ├── ai/
│   │   └── menuAssistantAI.js             # LLama 3 70B menu Q&A (HuggingFace)
│   ├── controllers/
│   │   ├── orderController.js             # Core order parser (~900 lines)
│   │   └── twilioController.js            # Twilio voice call webhooks
│   ├── models/
│   │   ├── combo.model.js                 # Combo schema (synced with backend)
│   │   ├── order.model.js                 # Order schema (synced with backend)
│   │   ├── product.model.js               # Product schema (synced with backend)
│   │   └── session.model.js               # Session state (current_order, upsell, clarification)
│   ├── routes/
│   │   ├── orderRoutes.js                 # POST /parse-order
│   │   └── twilioRoutes.js                # POST /twilio/voice, /gather, /status
│   ├── services/
│   │   ├── aiOrderParser.js               # LM Studio local model parser (fallback)
│   │   ├── aiParserService.js             # HuggingFace LLama 3 70B parser (primary)
│   │   └── sarvamService.js               # Sarvam AI TTS (bulbul:v3, en-IN)
│   ├── utils/
│   │   └── isQuestion.js                  # Question vs. order intent classifier
│   └── public/
│       └── audio/                         # Generated TTS audio files
│
└── voice-ui/                              # Legacy voice UI prototypes (static HTML)
    ├── index.html                         # Basic voice assistant
    ├── index2.html                        # Styled dark theme variant
    └── index3.html                        # Full session-persistent variant
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas cluster (or local MongoDB)
- HuggingFace API key (for LLama 3 70B)
- Sarvam AI API key (for Text-to-Speech)
- Twilio account (for phone ordering)
- (Optional) LM Studio running locally on port 1234

### 1. Backend API Server

```bash
cd backend
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables)), then:

```bash
node index.js
# Server starts on http://localhost:3001
```

To seed the database with sample products and orders:

```bash
node seed.js
```

### 2. Owner Dashboard

```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

### 3. User Dashboard

```bash
cd user-frontend
npm install
npm run dev
# Opens on http://localhost:5174
```

### 4. Voice AI Assistant

```bash
cd voice-ai-assistant
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables)), then:

```bash
node server.js
# Server starts on http://localhost:3002
```

### 5. Twilio Setup (for phone ordering)

1. Create a Twilio account and get a phone number
2. Set up ngrok to tunnel your local port 3002: `ngrok http 3002`
3. Configure your Twilio phone number's Voice webhook to: `https://<ngrok-url>/twilio/voice`
4. Set `TWILIO_NGROK_URL` in `.env` to the ngrok URL

---

## Environment Variables

### Backend (`backend/.env`)

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<dbname>
PORT=3001
```

### Voice AI Assistant (`voice-ai-assistant/.env`)

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<dbname>
PORT=3002

# AI APIs
HF_API_KEY=hf_...                          # HuggingFace API key (LLama 3 70B)
SARVAM_API_KEY=...                          # Sarvam AI TTS key

# Twilio (phone ordering)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+14302491367
TWILIO_NGROK_URL=https://...               # Ngrok tunnel URL for webhooks

# Optional
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json   # Google Cloud Speech
TELEGRAM_BOT_TOKEN=...                     # Telegram bot integration
```

---

## Database Models

### Product

| Field                 | Type       | Description                                                    |
|-----------------------|------------|----------------------------------------------------------------|
| `name`                | String     | Product name (required)                                        |
| `category`            | Enum       | `main`, `snack`, `dessert`, `beverages` (required)             |
| `selling_price`       | Number     | Menu price shown to customer (required)                        |
| `cost`                | Number     | Raw cost to produce the item (required)                        |
| `description`         | String     | Optional product description                                  |
| `recommendation_score`| Number     | Algorithm-generated recommendation score                       |
| `rating`              | Number     | Average customer rating                                        |
| `modifiers`           | Array      | Add-on options (e.g. size, extra cheese) with `name` + `options[{value, extra_price}]` |
| `suggested_price`     | Number     | Analytics-recommended price (set by owner via Pricing Dashboard) |
| `max_discount_pct`    | Number     | Maximum safe discount % without dropping below 20% margin       |
| `min_price`           | Number     | Floor price = `cost / (1 - 0.20)` — absolute minimum            |

**Indexes:** `{ category: 1 }`

### Order

| Field           | Type       | Description                                        |
|-----------------|------------|----------------------------------------------------|
| `order_id`      | String     | Unique UUID identifier (required, unique)          |
| `session_id`    | String     | User session ID for filtering (nullable)           |
| `order_channel` | Enum       | `voice`, `app`, `counter` (required)               |
| `items`         | Array      | `[{product_id, name, quantity, base_price, selected_modifiers}]` |
| `combos`        | Array      | `[{combo_id, combo_name, quantity, combo_price}]`  |
| `total_items`   | Number     | Total number of items in the order                 |
| `total_price`   | Number     | Sum of all item prices before discount             |
| `discount`      | Number     | Discount applied                                   |
| `final_price`   | Number     | Amount charged to customer                         |
| `order_score`   | Number     | Quality score of the order                         |
| `rating`        | Number     | Customer rating                                    |

**Indexes:** `{ "items.product_id": 1 }`, `{ session_id: 1 }`

### Combo

| Field                | Type       | Description                                       |
|----------------------|------------|---------------------------------------------------|
| `combo_name`         | String     | Display name for the combo (required)             |
| `description`        | String     | Auto-generated reasoning (default: "")            |
| `items`              | Array      | `[{product_id, name, quantity, base_price}]`      |
| `total_selling_price`| Number     | Sum of individual item prices (required)          |
| `combo_price`        | Number     | Discounted combo price (required)                 |
| `discount`           | Number     | Absolute discount amount                          |
| `total_cost`         | Number     | Sum of item costs                                 |
| `support`            | Number     | Association rule support value                    |
| `confidence`         | Number     | Association rule confidence value                 |
| `combo_score`        | Number     | Weighted composite score (0.4×confidence + 0.3×profit + 0.3×demand) |
| `rating`             | Number     | Customer rating                                   |

**Indexes:** `{ "items.product_id": 1 }`, `{ combo_score: -1 }`

### Session (Voice AI)

| Field                   | Type       | Description                                       |
|-------------------------|------------|---------------------------------------------------|
| `session_id`            | String     | Unique session identifier (from device/phone)     |
| `current_order`         | Object     | `{items: [...], combos: [...]}`                    |
| `last_upsell`           | Object     | Pending upsell `{combo_id, combo_name, combo_price}` or null |
| `pending_clarification` | Array      | Ambiguous product options `[{product_id, name, base_price}]` or null |
| `last_question`         | String     | Last menu question asked (for context)             |
| `status`                | String     | Session status (default: "ordering")               |

---

## API Endpoints

### Products — `/api/product`

| Method | Endpoint       | Description                                  |
|--------|----------------|----------------------------------------------|
| GET    | `/all`         | Get all products (sorted by category, name)  |
| POST   | `/add`         | Add a new product                            |
| PUT    | `/:id`         | Update product details                       |
| PUT    | `/:id/pricing` | Apply pricing recommendation (from analytics)|
| DELETE | `/:id`         | Delete a product                             |

### Orders — `/api/order`

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/`                   | Get all orders (newest first)        |
| GET    | `/session/:sessionId` | Get orders for a specific user session |
| POST   | `/add`                | Create a new order                   |
| PUT    | `/:id`                | Update order (price, discount, etc.) |
| DELETE | `/:id`                | Delete an order                      |

### Combos & Analytics — `/api/combo`

| Method | Endpoint                          | Description                                      |
|--------|-----------------------------------|--------------------------------------------------|
| POST   | `/add`                            | Save a generated combo to DB                     |
| GET    | `/all`                            | Get all saved combos (sorted by score desc)      |
| DELETE | `/:id`                            | Delete a saved combo                             |
| GET    | `/generate`                       | Generate smart combos from order data            |
| GET    | `/suggest/:productId`             | Get upsell suggestions for a specific product    |
| GET    | `/analytics/combo/:comboId`       | Deep analytics for a specific saved combo        |
| GET    | `/analytics/products`             | Product profitability analytics (BCG matrix)     |
| GET    | `/analytics/associations`         | Association rules from order data                |
| GET    | `/analytics/pricing`              | Pricing recommendations per product              |

### Voice AI Assistant — `http://localhost:3002`

| Method | Endpoint           | Description                                  |
|--------|--------------------|----------------------------------------------|
| POST   | `/parse-order`     | Parse natural language text into order items  |
| POST   | `/tts`             | Generate Text-to-Speech audio (Sarvam AI)    |
| GET    | `/test-sarvam`     | Test Sarvam TTS with `?text=...` query param |
| POST   | `/twilio/voice`    | Twilio incoming call webhook                 |
| POST   | `/twilio/gather`   | Twilio speech gather result webhook          |
| POST   | `/twilio/status`   | Twilio call status callback                  |

---

## Core Analytics Engine

All analytics functions live in `backend/src/controllers/analytics.controller.js` (~970 lines).

### 1. Product Analytics (BCG Classification)

**Purpose:** Analyses every product by computing profitability metrics and classifying into one of four strategic quadrants.

**Data Sources:** `Product` collection + `Order` collection

**Process:**

1. **Scan all orders** to build a sales map per product:
   - `unitsSold` — total quantity sold across all orders
   - `orderCount` — number of distinct orders containing the product
   - `revenue` — total revenue generated (`base_price × quantity`)

2. **Compute per-product metrics:**

   $$\text{Margin} = \text{sellingPrice} - \text{cost}$$

   $$\text{Margin\%} = \frac{\text{sellingPrice} - \text{cost}}{\text{sellingPrice}} \times 100$$

   $$\text{Order Frequency} = \frac{\text{orderCount}}{\text{totalOrders}}$$

   $$\text{Revenue Share} = \frac{\text{productRevenue}}{\text{totalRevenue}} \times 100$$

3. **Classify** into BCG-inspired matrix (see [Product Classification Matrix](#product-classification-matrix)).

**Output:** Array of product analytics with `margin`, `margin_pct`, `units_sold`, `order_frequency`, `revenue_share`, and `classification`.

---

### 2. Association Rule Mining

**Purpose:** Mines order history to discover which products are frequently bought together (Apriori-style pairwise analysis).

**Metrics computed per product pair:**

**Support** — fraction of all orders containing both items:

$$\text{Support}(A, B) = \frac{\text{pairFreq}(A, B)}{\text{totalOrders}}$$

**Confidence** — conditional purchase probability (max of both directions):

$$\text{Confidence} = \max\left(\frac{\text{pairFreq}(A, B)}{\text{freq}(A)},\ \frac{\text{pairFreq}(A, B)}{\text{freq}(B)}\right)$$

**Lift** — how much more likely the pair is bought together vs. random chance:

$$\text{Lift}(A, B) = \frac{\text{Support}(A,B)}{P(A) \times P(B)}$$

> Lift > 1.0 → positive association, Lift = 1.0 → independent, Lift < 1.0 → negative association

**Filter:** Only pairs with `support >= 0.02` are kept. Sorted by lift descending.

---

### 3. Smart Combo Generator

**Purpose:** Automatically generates profitable combo meal suggestions using two strategies, then scores, deduplicates, and ranks them.

#### Strategy 1: Pattern-Based Combos

Uses association rules to build combos from products customers already buy together.

**Filter criteria:** `confidence >= 0.3`, `lift >= 1.0`, `compatibility_score >= 0.4`

**Auto-adds** a beverage if neither item in the pair is a beverage.

**Discount:** Averages `max_discount_pct` from products (falls back to 10%), capped at 15%.

$$\text{comboPrice} = \text{totalSelling} - \lfloor \text{totalSelling} \times \text{discountRate} \rfloor$$

#### Strategy 2: Hidden Gem Boost Combos

Pairs high-margin low-frequency products ("hidden gems") with popular high-margin products ("stars") to increase visibility.

**Discount:** Averages `max_discount_pct` (falls back to 12%), capped at 20%.

#### Combo Score

$$\text{ComboScore} = 0.30 \times A + 0.25 \times P + 0.20 \times S + 0.15 \times C + 0.10 \times D$$

| Component          | Description                                                        | Weight |
|--------------------|--------------------------------------------------------------------|--------|
| **A** (Association)| $\min(1, \frac{\text{lift}}{3} \times \text{confidence})$         | 0.30   |
| **P** (Profit)     | $\min(1, \text{profitMargin})$                                    | 0.25   |
| **S** (Strategic)  | 1.0 if combo contains a hidden gem, else 0.4                      | 0.20   |
| **C** (Compat)     | Output of `getCompatibilityScore()`                                | 0.15   |
| **D** (Diversity)  | 1.0 if ≥3 categories, 0.6 if 2, 0.2 if 1                         | 0.10   |

**Output:** Top 15 combos ranked by score.

---

### 4. Combo Deep Analytics

**Endpoint:** `GET /api/combo/analytics/combo/:comboId`

**Computed Metrics:**

$$\text{comboMarginPct} = \frac{\text{comboPrice} - \text{totalCost}}{\text{comboPrice}} \times 100$$

$$\text{savingsPct} = \frac{\text{totalSelling} - \text{comboPrice}}{\text{totalSelling}} \times 100$$

$$\text{fullComboRate} = \frac{\text{ordersWithAllItems}}{\text{totalOrders}} \times 100$$

**Pairwise Affinity Labels:**

| Affinity Level | Criteria                                        |
|----------------|-------------------------------------------------|
| Very Strong    | `lift >= 2.5` AND `max(confAB, confBA) >= 0.4` |
| Strong         | `lift >= 1.5` AND `max(confAB, confBA) >= 0.3` |
| Moderate       | `lift >= 1.0`                                   |
| Weak           | Everything else                                 |

**Output:** `overall` (margin, savings, compatibility), `item_analytics` (per-item BCG), `pairwise_associations` (affinity data).

---

### 5. Upsell Suggestion Engine

**Endpoint:** `GET /api/combo/suggest/:productId`

When a customer adds a specific product, this recommends other items and combos that pair well.

**Upsell Priority Score:**

$$\text{UpsellScore} = 0.40 \times \text{confidence} + 0.25 \times \min(1, \text{marginPct}) + 0.20 \times \text{compatScore} + 0.15 \times \min\left(1, \frac{\text{lift}}{2}\right)$$

**Insight Tags:** Strong Pattern, Moderate Pattern, Strong Affinity, Above Average, High Margin, Good Margin, Low Margin.

**Output:** Top 10 individual suggestions + all matching saved combos.

---

### 6. Pricing Intelligence

**Endpoint:** `GET /api/combo/analytics/pricing`

**Min Acceptable Margin:** 30% (hard floor)

**Demand Score:**

$$\text{demandScore} = \min(100,\ \text{orderFrequency} \times 100 \times 2)$$

**Price Adjustments by Quadrant:**

| Quadrant      | Price Adjustment Range | Max Discount | Strategy                      |
|---------------|------------------------|--------------|-------------------------------|
| **Star**      | +2% to +14%           | 8%           | Increase price (high demand)  |
| **Hidden Gem**| −15% to 0%            | 25%          | Decrease price (boost demand) |
| **Volume Trap**| +5% to +15%          | 3%           | Increase price (recover margin)|
| **Dog**       | −8% to 0%             | 15%          | Decrease or flag for removal  |

**Apply Pricing:** `PUT /api/product/:id/pricing` persists `selling_price`, `suggested_price`, `max_discount_pct`, `min_price` to the product.

---

## Voice AI Assistant

The Voice AI Assistant (`voice-ai-assistant/`) is a standalone Express server that powers all AI ordering channels — text chat, browser voice, and phone calls.

### Order Parser

**Endpoint:** `POST /parse-order`

**Request:** `{ "text": "give me 2 burgers and a coke", "sessionId": "uuid" }`

The order parser processes user input through a priority-based pipeline:

```
Input Text
    │
    ├─→ 1. Is it a menu question? → Route to Menu AI (LLama 3 70B)
    │
    ├─→ 2. Is it a confirmation? → Save order to DB, return order_id + total
    │       ("confirm", "place order", "done", "finish", "that's all")
    │
    ├─→ 3. Is it an upsell response? → "yes" adds combo, "no" dismisses
    │
    ├─→ 4. Is it a clarification pick? → Resolve ambiguous product selection
    │
    ├─→ 5. Is it a quantity change? → Modify existing order items
    │       ("increase", "add more", "remove", "delete", "set to")
    │
    └─→ 6. New item addition → Fuzzy match with Fuse.js → Merge into order
```

**Key Features:**
- **Fuzzy Matching:** Fuse.js searches product names with configurable threshold — handles typos, partial names, spoken variations
- **Quantity Parsing:** Understands "two", "a", "another", numeric digits — extracts quantity + product text
- **Session Persistence:** MongoDB-backed session tracks `current_order`, `last_upsell`, `pending_clarification`
- **Auto-Upsell:** After adding items, suggests relevant combos from the database
- **Clarification Flow:** If fuzzy match returns multiple candidates, prompts user to choose (numbered list)
- **Order Modification:** Increase, decrease, set, or remove item quantities mid-order

**Response Schema:**
```json
{
  "message": "Added 2x Classic Burger to your order.",
  "clarification": "Did you mean: 1) Classic Burger 2) Veggie Burger?",
  "upsell": "Want to add the Burger Combo for ₹299? (Save ₹50!)",
  "order": { "items": [...], "combos": [...] },
  "order_id": "uuid",
  "completed": true,
  "total": 599
}
```

### Menu Question AI

**File:** `voice-ai-assistant/ai/menuAssistantAI.js`

**Model:** `meta-llama/Meta-Llama-3-70B-Instruct` via HuggingFace Router API

**Purpose:** Answers natural language questions about the menu — "What combos do you have?", "Which items are vegetarian?", "What's the most popular item?"

**Input:** Full menu (products + combos) + user question → 1–3 sentence natural language response.

**Question Detection:** `voice-ai-assistant/utils/isQuestion.js` uses keyword matching ("which", "suggest", "recommend", "menu", "price", "?") with order-intent override ("give me", "i want", "order").

### Twilio Phone Integration

**Files:** `voice-ai-assistant/controllers/twilioController.js`, `voice-ai-assistant/routes/twilioRoutes.js`

**Phone Number:** +1 (430) 249-1367

**Flow:**

1. Customer calls → Twilio hits `POST /twilio/voice`
2. Server responds with TwiML greeting + `<Gather input="speech">` (en-IN, auto speechTimeout)
3. Customer speaks → Twilio transcribes → hits `POST /twilio/gather`
4. Server processes via `parseOrder()` → responds with TwiML:
   - If order incomplete: speak response + new `<Gather>` for next input
   - If order confirmed: speak confirmation + `<Hangup />`
5. TTS: Sarvam AI if available, else Twilio `<Say>` fallback

### Text-to-Speech (Sarvam AI)

**File:** `voice-ai-assistant/services/sarvamService.js`

**Model:** `bulbul:v3` | **Speaker:** `ritu` (female) | **Language:** `en-IN`

**Endpoint:** `POST /tts` with `{ "text": "..." }` → returns base64-encoded WAV audio.

Used by: Voice Order page (browser), Twilio voice flow, test endpoint.

### AI Parsing Services

| Service | Model | Endpoint | Purpose |
|---------|-------|----------|---------|
| **aiParserService.js** | Meta-LLama 3 70B (HuggingFace) | `https://router.huggingface.co/v1` | Primary order text → JSON parser |
| **aiOrderParser.js** | LLama 3.1 8B (LM Studio local) | `http://localhost:1234/v1/chat/completions` | Fallback local parser |

Both extract `{items: [{name, quantity, modifiers}]}` from natural language order text.

---

## Owner Dashboard (Frontend)

**URL:** `http://localhost:5173` | **API Base:** `http://localhost:3001/api`

### Tabs

| # | Tab       | Page                  | Description                                                  |
|---|-----------|-----------------------|--------------------------------------------------------------|
| 1 | Analytics | `ProductAnalytics.jsx`| BCG quadrant view — margin %, frequency, revenue share, classification badges |
| 2 | Pricing   | `PricingDashboard.jsx`| Per-product price/discount recommendations — apply or customize before saving |
| 3 | Combos    | `ComboGenerator.jsx`  | Generate AI combos — view strategy, score, profit margin — save to DB |
| 4 | Manage    | `ManageCombos.jsx`    | Manage saved combos — overview stats, deep analytics modal, delete |
| 5 | Upsell    | `SuggestView.jsx`     | Pick a product → see ranked upsell suggestions with insight tags |
| 6 | Orders    | `Orders.jsx`          | Order table — edit (price, discount, channel), delete orders |

### Pricing Dashboard Features

- BCG classification badges (Star / Hidden Gem / Volume Trap / Dog)
- Filter by quadrant
- Shows: current price → suggested price, change amount/%, margin %, demand score
- "Apply Suggestion" button → `PUT /api/product/:id/pricing`
- "Customize" mode — edit price and max discount before applying
- Toast notifications on success/error

### Combo Analytics Modal (ManageCombos)

- Combo margin and customer savings
- Per-item BCG classification, margin, units sold, order frequency
- Pairwise buying patterns with affinity labels (Very Strong / Strong / Moderate / Weak)

---

## User Dashboard (User Frontend)

**URL:** `http://localhost:5174` | **Brand Name:** "Order & Dine"

### Session Management

Each user gets a persistent UUID stored in `localStorage` as `petpooja_session` (created via `crypto.randomUUID()`). This session ID:
- Links orders to the user across channels (chat, voice, phone)
- Filters "My Orders" to show only the current user's orders
- Persists across page refreshes

### Tab Persistence

All tabs remain mounted using CSS `display:none` instead of conditional rendering — chat history, voice transcripts, and order state survive tab switches.

### Tabs

| # | Tab       | Page              | Description                                                       |
|---|-----------|-------------------|-------------------------------------------------------------------|
| 1 | Menu      | `Menu.jsx`        | Browse all products and combos with category filter (all/main/snack/dessert/beverages) |
| 2 | AI Chat   | `ChatOrder.jsx`   | Text-based ordering — type orders, get AI responses, confirm with "confirm" |
| 3 | Voice     | `VoiceOrder.jsx`  | Speech-based ordering — mic button, live transcript, Sarvam TTS responses |
| 4 | Call      | `CallOrder.jsx`   | Phone ordering — tap-to-call button, Twilio number, how-it-works guide |
| 5 | My Orders | `MyOrders.jsx`    | Session-filtered order history — expandable cards with item details |

### AI Chat Ordering

- Conversational interface — user types, bot responds
- Sends `{sessionId, text}` to `POST http://localhost:3002/parse-order`
- Handles: order building, clarifications, upsell offers, confirmation
- Shows system message with order ID and total on confirmation
- "New Order" button resets chat only after order is complete

### Voice Ordering

- **Speech Input:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) in `en-IN`
- **States:** idle → listening → processing → speaking
- **TTS Output:** Primary: Sarvam AI (`POST /tts`), Fallback: `window.speechSynthesis`
- **Flow:** Tap mic → speak order → bot processes → bot speaks response → auto-continues listening
- Transcript history maintained throughout the ordering session
- "New Order" button resets after completion

### Phone Ordering

- Displays restaurant phone number: **+1 (430) 249-1367**
- "Call Now" button using `<a href="tel:+14302491367">`
- "How it works" guide: Call → Speak order → AI confirms → Order placed
- Powered by Twilio + Sarvam AI TTS

### My Orders

- Fetches `GET /api/order/session/:sessionId` — only current user's orders
- Stats cards: Total Orders, Total Spent, Average Order Value
- Expandable order cards showing:
  - Order ID, channel badge (voice/app), date
  - Individual items: quantity × name + price
  - Combos with (combo) label
  - Subtotal, discount (if any), final total

---

## Helper Functions

### `areCuisinesCompatible`

Prevents cross-cuisine pairing (e.g. Gulab Jamun + Pepperoni Pizza) unless one item is "universal".

| Cuisine   | Products                                                                                    |
|-----------|---------------------------------------------------------------------------------------------|
| Western   | Classic Burger, Grilled Sandwich, Chicken Wrap, Veggie Burger, New York Cheesecake          |
| Italian   | Margherita Pizza, Penne Pasta, Pepperoni Pizza                                              |
| Indian    | Paneer Tikka Wrap, Gulab Jamun, Mango Lassi, Masala Chai                                   |
| Universal | French Fries, Chicken Nuggets, Garlic Bread, Onion Rings, Mozzarella Sticks, Chocolate Brownie, Vanilla Ice Cream, Chocolate Mousse, Coke, Cold Coffee, Fresh Lemonade, Mojito, Chocolate Milkshake |

### `getCompatibilityScore`

Calculates average culinary compatibility for a product set:

$$\text{CompatibilityScore} = \frac{\sum_{(i,j)} S_{ij}}{|\text{pairs}|}$$

Where $S_{ij}$ is the compatibility matrix value, penalized by 0.3× if cuisines are incompatible.

---

## Equations & Scoring Formulas

### Summary of All Equations

| # | Equation | Used In |
|---|----------|---------|
| 1 | $\text{Margin} = \text{price} - \text{cost}$ | Product Analytics |
| 2 | $\text{Margin\%} = \frac{\text{price} - \text{cost}}{\text{price}} \times 100$ | Product Analytics |
| 3 | $\text{Order Frequency} = \frac{\text{orderCount}}{\text{totalOrders}}$ | Product Analytics |
| 4 | $\text{Revenue Share} = \frac{\text{productRevenue}}{\text{totalRevenue}} \times 100$ | Product Analytics |
| 5 | $\text{Support}(A,B) = \frac{\text{pairFreq}(A,B)}{\text{totalOrders}}$ | Association Mining |
| 6 | $\text{Confidence}(A \to B) = \frac{\text{pairFreq}(A,B)}{\text{freq}(A)}$ | Association Mining |
| 7 | $\text{Lift}(A,B) = \frac{\text{Support}(A,B)}{P(A) \times P(B)}$ | Association Mining |
| 8 | $\text{ComboScore} = 0.30A + 0.25P + 0.20S + 0.15C + 0.10D$ | Combo Generator |
| 9 | $\text{UpsellScore} = 0.40 \cdot \text{conf} + 0.25 \cdot \text{margin} + 0.20 \cdot \text{compat} + 0.15 \cdot \text{lift}$ | Upsell Engine |
| 10 | $\text{CompatScore} = \frac{1}{n} \sum S_{ij}$ | Combo Compatibility |
| 11 | $\text{comboMarginPct} = \frac{\text{comboPrice} - \text{totalCost}}{\text{comboPrice}} \times 100$ | Combo Analytics |
| 12 | $\text{savingsPct} = \frac{\text{totalSelling} - \text{comboPrice}}{\text{totalSelling}} \times 100$ | Combo Analytics |
| 13 | $\text{fullComboRate} = \frac{\text{ordersWithAllItems}}{\text{totalOrders}} \times 100$ | Combo Analytics |
| 14 | $\text{demandScore} = \min(100,\ \text{orderFreq} \times 200)$ | Pricing Intelligence |
| 15 | $\text{minPrice} = \frac{\text{cost}}{1 - 0.20}$ | Pricing Intelligence |

---

## Category Compatibility Matrix

Scores range from 0 to 1, indicating how well two food categories pair together.

|              | Main  | Snack | Dessert | Beverages |
|--------------|-------|-------|---------|-----------|
| **Main**     | 0.20  | 0.90  | 0.50    | 0.95      |
| **Snack**    | 0.90  | 0.30  | 0.40    | 0.90      |
| **Dessert**  | 0.30  | 0.40  | 0.20    | 0.80      |
| **Beverages**| 0.95  | 0.90  | 0.80    | 0.20      |

**Key observations:**
- Same-category = penalized (0.2–0.3) — two mains don't make a combo
- **Main + Beverages** (0.95) = strongest pairing
- **Main + Snack** (0.90) = natural meal combo
- **Dessert + Beverages** (0.80) = solid post-meal pairing

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

| Classification | Margin % | Order Freq | Strategy                              |
|----------------|----------|------------|---------------------------------------|
| **Star**       | ≥ 50%    | ≥ 15%     | Promote heavily, feature in combos    |
| **Hidden Gem** | ≥ 50%    | < 15%     | Boost visibility by pairing with stars|
| **Volume Trap**| < 50%    | ≥ 15%     | Raise price or pair with high-margin items|
| **Dog**        | < 50%    | < 15%     | Consider discontinuing or repositioning|

---

## License

This project is proprietary and developed for the PetPooja Revenue Intelligence platform.
