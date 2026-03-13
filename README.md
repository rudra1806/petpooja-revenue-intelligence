# PetPooja — AI-Powered Restaurant Revenue Intelligence Platform

> A full-stack restaurant management platform that combines **revenue analytics**, **AI-powered ordering** (text chat, browser voice, and phone call), **smart combo generation**, **dynamic pricing intelligence**, and **real-time upsell recommendations** — built for both restaurant owners and customers.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database Models](#database-models)
9. [API Reference](#api-reference)
10. [Core Analytics Engine](#core-analytics-engine)
    - [Product Analytics (BCG Classification)](#1-product-analytics-bcg-classification)
    - [Association Rule Mining](#2-association-rule-mining)
    - [Smart Combo Generator](#3-smart-combo-generator)
    - [Combo Deep Analytics](#4-combo-deep-analytics)
    - [Upsell Suggestion Engine](#5-upsell-suggestion-engine)
    - [Pricing Intelligence](#6-pricing-intelligence)
11. [Voice AI Assistant](#voice-ai-assistant)
    - [Order Parser Pipeline](#order-parser-pipeline)
    - [Menu Question AI (LLama 3 70B)](#menu-question-ai-llama-3-70b)
    - [Text-to-Speech (Sarvam AI)](#text-to-speech-sarvam-ai)
    - [Twilio Phone Ordering Integration](#twilio-phone-ordering-integration)
    - [Authentication System](#authentication-system)
    - [Gmail Order Notifications](#gmail-order-notifications)
12. [Owner Dashboard](#owner-dashboard)
13. [User Dashboard](#user-dashboard)
14. [Scoring Formulas & Equations](#scoring-formulas--equations)
15. [Category Compatibility Matrix](#category-compatibility-matrix)
16. [Product Classification Matrix](#product-classification-matrix)

---

## Project Overview

**PetPooja** is a full-stack restaurant intelligence platform built for a hackathon as a final project. It solves a real-world problem faced by restaurant owners: *they have no systematic way to understand which products to promote, how to price them, or how to maximize revenue through smart combos and upselling.*

The platform consists of four independent services that work together:

| Service | Role | Port |
|---------|------|------|
| **Backend API** | Core REST API (products, orders, combos, analytics) | `3001` |
| **Owner Dashboard** | React web app for restaurant managers | `5173` |
| **User Dashboard** | React web app for customers ordering food | `5174` |
| **Voice AI Assistant** | AI ordering engine (chat, voice, phone) + auth | `3002` |

The platform does not just display data — it **mines order history**, **generates actionable recommendations**, and allows customers to place orders through **three AI-powered channels**: typed text, browser microphone, or a real phone call.

---

## Key Features

### For Restaurant Owners
- **BCG Product Analytics** — Classifies every product as Star, Hidden Gem, Volume Trap, or Dog based on real sales data
- **Pricing Intelligence** — Per-product price and discount recommendations with one-click apply
- **Smart Combo Generator** — AI-auto-generates themed meal combos from historical co-purchase patterns
- **Combo Deep Analytics** — Detailed profitability, pairwise affinity, and customer savings stats for each saved combo
- **Upsell Suggestion Engine** — For any product, shows the best items to upsell, ranked by weighted score
- **Order Management** — Full CRUD table to view, edit, and delete all customer orders
- **Gmail Notifications** — Sends email notifications to the owner when new orders arrive

### For Customers
- **Menu Browser** — Browse all products and combos with category filters
- **AI Text Chat Ordering** — Type orders in natural language (e.g. "give me 2 burgers and a coke")
- **AI Voice Ordering** — Speak orders via the browser microphone; AI responds with voice
- **Phone Call Ordering** — Call a real Twilio phone number; a fully automated AI agent takes the order
- **My Orders** — Authenticated user order history with full item, modifier, and price breakdown
- **Email Verification** — Registration flow with email verification via Gmail SMTP

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT LAYER                                    │
│                                                                                │
│   ┌──────────────────────────────┐         ┌──────────────────────────────┐    │
│   │   Owner Dashboard            │         │   User Dashboard             │    │
│   │   (React 19 + Vite 7)        │         │   (React 19 + Vite 7)        │    │
│   │   http://localhost:5173      │         │   http://localhost:5174       │    │
│   ├──────────────────────────────┤         ├──────────────────────────────┤    │
│   │ • Product Analytics (BCG)    │         │ • Menu Browser               │    │
│   │ • Pricing Dashboard          │         │ • AI Text Chat Ordering      │    │
│   │ • Smart Combo Generator      │         │ • Voice Ordering (Web Speech)│    │
│   │ • Manage Combos              │         │ • Phone Ordering (Twilio)    │    │
│   │ • Upsell Suggestion View     │         │ • My Orders (Auth Linked)    │    │
│   │ • Order Management Table     │         │                              │    │
│   └──────────┬───────────────────┘         └─────────┬──────┬────────────┘    │
│              │ REST API                              │      │                  │
└──────────────┼───────────────────────────────────────┼──────┼──────────────────┘
               │                                       │      │ /parse-order
               │                                       │      │ /tts
┌──────────────▼────────────────┐    ┌─────────────────▼──────▼──────────────────┐
│   Backend API Server          │    │   Voice AI Assistant Server               │
│   (Express.js 5)              │    │   (Express.js 5)                          │
│   http://localhost:3001       │    │   http://localhost:3002                   │
│                               │    │                                           │
│   • Products CRUD             │    │   • Order Parsing (Fuse.js fuzzy match)   │
│   • Orders CRUD               │    │   • Session Management (MongoDB)          │
│   • Combos CRUD               │    │   • AI Menu Q&A (LLama 3 70B)             │
│   • Analytics Engine          │    │   • TTS (Sarvam AI — bulbul:v3)           │
│   • Pricing Recommendations   │    │   • Twilio Voice Call Webhooks            │
│   • Association Rule Mining   │    │   • Auth (Register / Login / JWT Cookie)  │
│                               │    │   • Gmail Email Notifications             │
└──────────────┬────────────────┘    └──────┬──────────────────┬─────────────────┘
               │                            │                  │
               └────────────┬───────────────┘                  │
                            │                                  │
               ┌────────────▼────────────┐        ┌───────────▼──────────────────┐
               │   MongoDB Atlas          │        │   External AI & Cloud Services│
               │                         │        │                               │
               │   • products            │        │   • HuggingFace API           │
               │   • orders              │        │     (Meta-LLama 3 70B)        │
               │   • combos              │        │   • LM Studio (local fallback)│
               │   • sessions            │        │   • Sarvam AI (TTS)           │
               │   • users               │        │   • Twilio (Phone Ordering)   │
               └─────────────────────────┘        │   • Gmail SMTP (Email)        │
                                                  └───────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Owner Frontend** | React 19, Vite 7, CSS3, DM Sans + JetBrains Mono (Google Fonts) |
| **User Frontend** | React 19, Vite 7, CSS3, Web Speech API (SpeechRecognition) |
| **Backend API** | Node.js, Express 5, Mongoose 9, MongoDB Atlas |
| **Voice AI Server** | Node.js, Express 5, Fuse.js 7, uuid, cookie-parser |
| **Database** | MongoDB Atlas (cloud) via Mongoose ODM |
| **Primary AI / NLP** | Meta-LLama 3 70B via HuggingFace Router API |
| **Fallback AI** | LLama 3.1 8B via LM Studio (running locally on port 1234) |
| **Text-to-Speech** | Sarvam AI — model: `bulbul:v3`, speaker: `ritu`, language: `en-IN` |
| **Phone Calls** | Twilio Voice (TwiML, built-in speech-to-text) |
| **Email** | Nodemailer via Gmail SMTP (App Password) |
| **Authentication** | JWT (stored in HTTP-only cookie) + email verification |
| **Analytics** | Custom-built association rule mining + BCG matrix classification |

---

## Project Structure

```
hackamined/
├── README.md
│
├── backend/                               # REST API Server (Port 3001)
│   ├── index.js                           # Entry point — connects DB, starts server
│   ├── seed.js                            # Database seeder with sample data
│   └── src/
│       ├── app.js                         # Express setup — CORS, routes, middleware
│       ├── config/
│       │   └── db.js                      # MongoDB connection via MONGO_URL
│       ├── controllers/
│       │   ├── analytics.controller.js    # Entire analytics engine (~970 lines)
│       │   ├── combo.controller.js        # Combo CRUD (save, list, delete)
│       │   ├── order.controller.js        # Order CRUD + session filtering
│       │   └── product.controller.js      # Product CRUD + pricing application
│       ├── models/
│       │   ├── product.model.js           # Product schema with pricing intelligence fields
│       │   ├── order.model.js             # Order schema (items, combos, session_id)
│       │   └── combo.model.js             # Combo schema with score and analytics fields
│       └── routes/
│           ├── product.route.js           # /api/product/*
│           ├── order.route.js             # /api/order/*
│           └── combo.route.js             # /api/combo/* (CRUD + analytics)
│
├── frontend/                              # Owner Dashboard (Port 5173)
│   └── src/
│       ├── App.jsx                        # Tab navigation (6 tabs + state management)
│       ├── index.css                      # Design system — dark theme, DM Sans
│       └── pages/
│           ├── ProductAnalytics.jsx       # BCG quadrant classification view
│           ├── PricingDashboard.jsx       # Dynamic pricing recommendations
│           ├── ComboGenerator.jsx         # AI combo generation + save to DB
│           ├── ManageCombos.jsx           # Manage saved combos + deep analytics modal
│           ├── SuggestView.jsx            # Upsell suggestion engine interface
│           └── Orders.jsx                 # Order management CRUD table + email notif
│
├── user-frontend/                         # User Dashboard (Port 5174)
│   └── src/
│       ├── App.jsx                        # Tab navigation + session UUID management
│       ├── index.css                      # Design system — matching owner dark theme
│       └── pages/
│           ├── Menu.jsx                   # Product & combo browser with category filter
│           ├── ChatOrder.jsx              # AI text-based ordering interface
│           ├── VoiceOrder.jsx             # Voice ordering with Web Speech API
│           ├── CallOrder.jsx              # Phone ordering link to Twilio number
│           └── MyOrders.jsx               # User-authenticated order history
│
├── voice-ai-assistant/                    # Voice AI Server (Port 3002)
│   ├── server.js                          # Entry point — Express, routes, TTS endpoint
│   ├── ai/
│   │   └── menuAssistantAI.js             # LLama 3 70B menu Q&A (HuggingFace)
│   ├── controllers/
│   │   ├── orderController.js             # Core order parser (~900 lines)
│   │   ├── twilioController.js            # Twilio voice call webhooks
│   │   └── authController.js             # Register, login, logout, email verify
│   ├── models/
│   │   ├── product.model.js               # Synced with backend schema
│   │   ├── order.model.js                 # Synced with backend schema
│   │   ├── combo.model.js                 # Synced with backend schema
│   │   ├── session.model.js               # Session state (order, upsell, clarification)
│   │   └── user.model.js                  # User schema (auth, verification token)
│   ├── routes/
│   │   ├── orderRoutes.js                 # POST /parse-order
│   │   ├── twilioRoutes.js                # Twilio webhooks
│   │   ├── authRoutes.js                  # /api/auth/* (register, login, logout, verify)
│   │   ├── menuRoutes.js                  # /api/product/all, /api/combo/all (menu sync)
│   │   └── billRoutes.js                  # Bill generation endpoint
│   ├── services/
│   │   ├── aiParserService.js             # HuggingFace LLama 3 70B parser (primary)
│   │   ├── aiOrderParser.js               # LM Studio local model parser (fallback)
│   │   ├── sarvamService.js               # Sarvam AI TTS (bulbul:v3, en-IN)
│   │   └── emailService.js                # Nodemailer Gmail SMTP (email verification)
│   └── utils/
│       └── isQuestion.js                  # Question vs. order intent classifier
│
├── voice-ui/                              # Legacy voice UI prototypes (static HTML)
│   ├── index.html                         # Basic voice assistant
│   ├── index2.html                        # Dark theme variant
│   └── index3.html                        # Session-persistent variant
│
└── image/                                 # Product images (AVIF format, optimised)
    ├── logo.jpeg
    └── [26 product images].avif
```

---

## Getting Started

### Prerequisites

Before running the project, ensure the following are available:

- **Node.js v18+** — for running all four services
- **MongoDB Atlas cluster** — or a local MongoDB instance
- **HuggingFace API Key** — for LLama 3 70B (primary AI)
- **Sarvam AI API Key** — for Text-to-Speech (Indian English voice)
- **Twilio Account + Phone Number** — for phone call ordering
- **Gmail App Password** — for email verification and order notifications
- *(Optional)* **LM Studio** running locally on port `1234` — fallback AI parser
- *(Optional)* **ngrok** — to expose the Voice AI server for Twilio webhooks

---

### Step 1 — Start the Backend API Server

```bash
cd backend
npm install
# Create a .env file (see Environment Variables section)
node index.js
# ✅ Server running on http://localhost:3001
```

To seed the database with sample products and orders:

```bash
node seed.js
```

---

### Step 2 — Start the Owner Dashboard

```bash
cd frontend
npm install
npm run dev
# ✅ Opens on http://localhost:5173
```

---

### Step 3 — Start the User Dashboard

```bash
cd user-frontend
npm install
npm run dev
# ✅ Opens on http://localhost:5174
```

---

### Step 4 — Start the Voice AI Assistant Server

```bash
cd voice-ai-assistant
npm install
# Create a .env file (see Environment Variables section)
node server.js
# ✅ Server running on http://localhost:3002
```

---

### Step 5 — Set Up Twilio Phone Ordering (Optional)

1. Create a Twilio account at [twilio.com](https://twilio.com) and purchase a phone number.
2. Run ngrok to expose your local Voice AI server:
   ```bash
   ngrok http 3002
   ```
3. In Twilio Console → Phone Numbers → Configure Voice, set the webhook URL to:
   ```
   https://<your-ngrok-url>/twilio/voice
   ```
4. Add the ngrok URL as `TWILIO_NGROK_URL` in your `.env` file.

---

## Environment Variables

### Backend (`backend/.env`)

```env
MONGO_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
PORT=3001
```

### Voice AI Assistant (`voice-ai-assistant/.env`)

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# Server
PORT=3002
BASE_URL=http://localhost:3002

# AI APIs
HF_API_KEY=hf_...                    # HuggingFace API key (LLama 3 70B)
SARVAM_API_KEY=...                   # Sarvam AI TTS key

# Twilio (Phone Ordering)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+14302491367
TWILIO_NGROK_URL=https://...         # Ngrok tunnel URL for Twilio webhooks

# Gmail SMTP (Email Verification & Order Notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password   # 16-char Google App Password (NOT your Gmail password)

# JWT
JWT_SECRET=your-jwt-secret-key
```

> **Important:** For Gmail, you must use a **Google App Password**, not your regular Gmail password. Enable 2FA on your Google account, then generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

---

## Database Models

### Product

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Product name (required, unique) |
| `category` | Enum | `main`, `snack`, `dessert`, `beverages` (required) |
| `selling_price` | Number | Menu price shown to the customer (required) |
| `cost` | Number | Raw cost to produce the item (required) |
| `description` | String | Optional product description |
| `recommendation_score` | Number | Algorithm-generated recommendation score |
| `rating` | Number | Average customer rating |
| `modifiers` | Array | Add-on options (e.g. size, extra toppings) with `name` and `options[{value, extra_price}]` |
| `suggested_price` | Number | Analytics-recommended optimal price |
| `max_discount_pct` | Number | Maximum safe discount % without going below 20% margin |
| `min_price` | Number | Floor price = `cost / (1 - 0.20)` — absolute minimum safe price |

**Indexes:** `{ category: 1 }`

---

### Order

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | String | Unique UUID identifier (required, unique) |
| `user_id` | ObjectId| Links order to authenticated user via JWT |
| `session_id` | String | User session ID for fallback tracking |
| `order_channel` | Enum | `voice`, `app`, `counter` (required) |
| `items` | Array | `[{product_id, name, quantity, base_price, selected_modifiers}]` |
| `combos` | Array | `[{combo_id, combo_name, quantity, combo_price}]` |
| `total_items` | Number | Total count of all items in the order |
| `total_price` | Number | Sum of all item prices before discount |
| `discount` | Number | Discount amount applied |
| `final_price` | Number | Net amount charged to the customer |
| `order_score` | Number | Algorithm-computed quality score |
| `rating` | Number | Customer rating for the order |

**Indexes:** `{ "items.product_id": 1 }`, `{ session_id: 1 }`

---

### Combo

| Field | Type | Description |
|-------|------|-------------|
| `combo_name` | String | Display name for the combo (required) |
| `description` | String | Auto-generated reasoning for the combo |
| `items` | Array | `[{product_id, name, quantity, base_price}]` |
| `total_selling_price` | Number | Sum of individual item full prices |
| `combo_price` | Number | Discounted bundle price (required) |
| `discount` | Number | Absolute discount amount in rupees |
| `total_cost` | Number | Sum of individual item costs |
| `support` | Number | Association rule support value (0–1) |
| `confidence` | Number | Association rule confidence value (0–1) |
| `combo_score` | Number | Weighted composite quality score |
| `rating` | Number | Customer rating |

**Indexes:** `{ "items.product_id": 1 }`, `{ combo_score: -1 }`

---

### Session (Voice AI)

Maintains stateful ordering sessions for AI ordering across text, voice, and phone channels.

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | String | Unique session identifier (from device UUID or phone call SID) |
| `current_order` | Object | `{items: [...], combos: [...]}` — live order in progress |
| `last_upsell` | Object | Pending upsell offer `{combo_id, combo_name, combo_price}` or `null` |
| `pending_clarification` | Array | Ambiguous product candidates for clarification prompt or `null` |
| `last_question` | String | Last menu question asked (for context continuity) |
| `status` | String | Current session status (default: `"ordering"`) |

---

### User (Auth)

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | User's display name (required) |
| `email` | String | User email address (required, unique) |
| `password` | String | Hashed password (bcrypt) |
| `isVerified` | Boolean | Whether email has been verified (default: `false`) |
| `verificationToken` | String | UUID token sent in the verification email |
| `verificationExpiry` | Date | Token expiry (24 hours from registration) |

---

## API Reference

### Products — `/api/product`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/all` | Get all products sorted by category and name |
| `POST` | `/add` | Add a new product to the menu |
| `PUT` | `/:id` | Update product name, price, category, description, etc. |
| `PUT` | `/:id/pricing` | Apply analytics-recommended pricing (updates `selling_price`, `max_discount_pct`, `min_price`, `suggested_price`) |
| `DELETE` | `/:id` | Remove a product from the menu |

---

### Orders — `/api/order`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get all orders, newest first |
| `GET` | `/session/:sessionId` | Get orders belonging to a specific user session (used by "My Orders") |
| `POST` | `/add` | Create a new order |
| `PUT` | `/:id` | Update an order (price, discount, channel, etc.) |
| `DELETE` | `/:id` | Delete an order |

---

### Combos & Analytics — `/api/combo`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/add` | Save a generated combo to the database |
| `GET` | `/all` | Get all saved combos, sorted by score descending |
| `DELETE` | `/:id` | Delete a saved combo |
| `GET` | `/generate` | Generate smart combos from historical order data |
| `GET` | `/suggest/:productId` | Get ranked upsell suggestions for a specific product |
| `GET` | `/analytics/combo/:comboId` | Deep analytics for a specific saved combo |
| `GET` | `/analytics/products` | BCG matrix product profitability analytics |
| `GET` | `/analytics/associations` | Pairwise association rules from order history |
| `GET` | `/analytics/pricing` | Per-product pricing recommendations |

---

### Voice AI Assistant — `http://localhost:3002`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/parse-order` | Parse natural language text/voice input into structured order |
| `GET` | `/order/user/:userId` | Fetch all orders belonging to the authenticated user |
| `POST` | `/tts` | Convert text to speech via Sarvam AI, returns base64 WAV |
| `GET` | `/test-sarvam` | Test TTS with `?text=` query parameter, plays audio in browser |
| `POST` | `/twilio/voice` | Twilio webhook — handles incoming phone call, returns greeting TwiML |
| `POST` | `/twilio/gather` | Twilio webhook — processes speech input from the caller |
| `POST` | `/twilio/status` | Twilio call status update webhook |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login, returns JWT in HTTP-only cookie |
| `POST` | `/api/auth/logout` | Clears the JWT cookie |
| `GET` | `/api/auth/verify-email` | Verifies email address with token from URL |
| `GET` | `/api/product/all` | Fetch full menu (products) — used by the ordering AI |
| `GET` | `/api/combo/all` | Fetch all combos — used by the ordering AI for upsells |

---

## Core Analytics Engine

All analytics functions are implemented in `backend/src/controllers/analytics.controller.js` (~970 lines of custom logic — no third-party analytics library is used).

---

### 1. Product Analytics (BCG Classification)

**Purpose:** Analyze every product's sales performance and classify it into one of four strategic quadrants, enabling owners to make informed decisions about pricing, promotion, and discontinuation.

**Data sources used:** `Product` collection + `Order` collection

**Step-by-step process:**

1. **Scan all orders** to build per-product sales aggregates:
   - `unitsSold` — total quantity sold across all historical orders
   - `orderCount` — number of distinct orders containing the product
   - `revenue` — total revenue generated (`base_price × quantity`)

2. **Compute profitability metrics:**

   $$\text{Margin} = \text{sellingPrice} - \text{cost}$$

   $$\text{Margin\%} = \frac{\text{sellingPrice} - \text{cost}}{\text{sellingPrice}} \times 100$$

   $$\text{Order Frequency} = \frac{\text{orderCount}}{\text{totalOrders}}$$

   $$\text{Revenue Share} = \frac{\text{productRevenue}}{\text{totalRevenue}} \times 100$$

3. **Classify** each product into a BCG-inspired strategic quadrant (see [Product Classification Matrix](#product-classification-matrix)).

**Output:** Array of products with `margin`, `margin_pct`, `units_sold`, `order_frequency`, `revenue_share`, and `classification`.

---

### 2. Association Rule Mining

**Purpose:** Discover which products customers most frequently buy together. This is the foundation for combo generation and upsell recommendations. The implementation uses a custom **Apriori-style pairwise analysis** algorithm.

**Metrics computed per product pair:**

**Support** — What fraction of all orders contain both items A and B:

$$\text{Support}(A, B) = \frac{\text{pairFrequency}(A, B)}{\text{totalOrders}}$$

**Confidence** — How likely is B to be purchased when A is already in the order (max of both directions):

$$\text{Confidence} = \max\left(\frac{\text{pairFreq}(A, B)}{\text{freq}(A)},\ \frac{\text{pairFreq}(A, B)}{\text{freq}(B)}\right)$$

**Lift** — How much more often A and B are bought together compared to if they were purchased independently:

$$\text{Lift}(A, B) = \frac{\text{Support}(A,B)}{P(A) \times P(B)}$$

> - Lift > 1.0 → Strong positive association (buy together more than expected)
> - Lift = 1.0 → Statistically independent
> - Lift < 1.0 → Negative association (rarely bought together)

**Filter:** Only pairs with `support >= 0.02` are retained. Results are sorted by lift descending.

---

### 3. Smart Combo Generator

**Purpose:** Automatically generate profitable meal combo suggestions using two complementary strategies, then score, deduplicate, and rank the results.

#### Strategy 1: Pattern-Based Combos

Uses association rules to build combos around products customers already buy together.

**Filter criteria for inclusion:** `confidence >= 0.3` AND `lift >= 1.0` AND `compatibility_score >= 0.4`

- **Auto-beverage logic:** If neither product in the pair is a beverage, the highest-selling beverage is automatically added to create a complete meal.
- **Discount calculation:** Averages `max_discount_pct` from all combo items (falls back to 10%), capped at 15%.

$$\text{comboPrice} = \text{totalSelling} - \lfloor \text{totalSelling} \times \text{discountRate} \rfloor$$

#### Strategy 2: Hidden Gem Boost Combos

Pairs **high-margin, low-frequency products** ("Hidden Gems") with **high-margin, high-frequency products** ("Stars") to boost visibility of underperforming items.

- **Discount:** Averages `max_discount_pct` from all items (falls back to 12%), capped at 20%.

#### Combo Quality Score

Each generated combo is scored using a weighted five-component formula:

$$\text{ComboScore} = 0.30 \times A + 0.25 \times P + 0.20 \times S + 0.15 \times C + 0.10 \times D$$

| Component | Formula | Weight | What it measures |
|-----------|---------|--------|-----------------|
| **A** (Association) | $\min\left(1,\ \frac{\text{lift}}{3} \times \text{confidence}\right)$ | 0.30 | How strongly products are co-purchased |
| **P** (Profit) | $\min(1,\ \text{profitMargin})$ | 0.25 | Profit margin of the combo |
| **S** (Strategic) | `1.0` if contains Hidden Gem, else `0.4` | 0.20 | Strategic value (Hidden Gem boosting) |
| **C** (Compatibility) | Output of `getCompatibilityScore()` | 0.15 | Culinary pairing compatibility |
| **D** (Diversity) | `1.0` if ≥3 categories, `0.6` if 2, `0.2` if 1 | 0.10 | Menu category diversity |

**Output:** Top 15 combos ranked by ComboScore, ready to be saved by the owner.

---

### 4. Combo Deep Analytics

**Endpoint:** `GET /api/combo/analytics/combo/:comboId`

Provides detailed profitability and buying-pattern analysis for any saved combo.

**Computed metrics:**

$$\text{comboMarginPct} = \frac{\text{comboPrice} - \text{totalCost}}{\text{comboPrice}} \times 100$$

$$\text{savingsPct} = \frac{\text{totalSelling} - \text{comboPrice}}{\text{totalSelling}} \times 100$$

$$\text{fullComboRate} = \frac{\text{ordersWithAllItems}}{\text{totalOrders}} \times 100$$

**Pairwise Affinity Labels** (shown in the modal for each item pair):

| Affinity Level | Criteria |
|----------------|---------|
| **Very Strong** | `lift >= 2.5` AND `max(confAB, confBA) >= 0.4` |
| **Strong** | `lift >= 1.5` AND `max(confAB, confBA) >= 0.3` |
| **Moderate** | `lift >= 1.0` |
| **Weak** | All other cases |

**Output structure:** `overall` (margin %, savings %, compatibility), `item_analytics` (per-item BCG classification + stats), `pairwise_associations` (affinity labels, lift, confidence for each product pair).

---

### 5. Upsell Suggestion Engine

**Endpoint:** `GET /api/combo/suggest/:productId`

When a customer adds a specific product to their order, this engine recommends the best additional items and saved combos to suggest — ranked by a weighted priority score.

**Upsell Priority Score:**

$$\text{UpsellScore} = 0.40 \times \text{confidence} + 0.25 \times \min(1, \text{marginPct}) + 0.20 \times \text{compatScore} + 0.15 \times \min\!\left(1,\ \frac{\text{lift}}{2}\right)$$

| Weight | Factor | Rationale |
|--------|--------|-----------|
| **0.40** | Confidence | Most predictive of actual co-purchase behavior |
| **0.25** | Margin % | Prioritizes high-profit upsells |
| **0.20** | Compatibility | Ensures culinary compatibility |
| **0.15** | Lift | Penalizes coincidental co-purchases |

**Insight Tags** shown alongside suggestions: `Strong Pattern`, `Moderate Pattern`, `Strong Affinity`, `Above Average`, `High Margin`, `Good Margin`, `Low Margin`.

**Output:** Top 10 individual product suggestions + all matching saved combos.

---

### 6. Pricing Intelligence

**Endpoint:** `GET /api/combo/analytics/pricing`

Generates per-product price and discount recommendations based on the product's BCG classification and demand data.

**Minimum acceptable margin hardcoded:** 30% (no recommendation will drop below this)

**Demand Score:**

$$\text{demandScore} = \min(100,\ \text{orderFrequency} \times 100 \times 2)$$

**Price Adjustment Strategy by Quadrant:**

| Quadrant | Price Adjustment | Max Discount | Strategy |
|----------|-----------------|--------------|----------|
| **Star** | +2% to +14% | 8% | Increase price (customers already love it) |
| **Hidden Gem** | −15% to 0% | 25% | Lower price to stimulate demand |
| **Volume Trap** | +5% to +15% | 3% | Raise price to recover margin |
| **Dog** | −8% to 0% | 15% | Lower price or flag for removal |

**Apply Pricing:** `PUT /api/product/:id/pricing` persists `selling_price`, `suggested_price`, `max_discount_pct`, and `min_price` directly to the product record.

---

## Voice AI Assistant

The Voice AI Assistant (`voice-ai-assistant/`) is a standalone Express server on port `3002` that powers all AI-driven customer interactions: text chat, browser voice, and real phone calls.

---

### Order Parser Pipeline

**Endpoint:** `POST /parse-order`

**Request body:** `{ "text": "give me 2 burgers and a coke", "sessionId": "uuid" }`

Every input message is processed through a **priority-based decision pipeline**:

```
Input Text (from Chat / Voice / Phone)
    │
    ├─→ Step 1: Is it a negotiation or menu question?
    │           "give it for 100 rs?" → Redirect to budget options
    │           "what combos do you have?" → Route to Menu AI
    │
    ├─→ Step 2: Is it a confirmation?
    │           "confirm", "place order", "done", "finish", "that's all"
    │           → Save completed order to MongoDB, return order_id + total
    │
    ├─→ Step 3: Is it an upsell response?
    │           "yes" → Add the pending combo to the order
    │           "no" → Dismiss the upsell offer
    │
    ├─→ Step 4: Is it a clarification pick?
    │           "1", "the first one", "second"
    │           → Resolve ambiguous product selection from pending_clarification list
    │
    ├─→ Step 5: Is it a quantity modification?
    │           "increase", "add more", "remove", "delete", "set to X"
    │           → Modify existing item quantity in the current session order
    │
    └─→ Step 6: New item addition
                → Fuzzy match with Fuse.js against all products
                → If single strong match: add to order
                → If multiple candidates: trigger clarification flow
                → After adding: auto-suggest a relevant upsell combo
```

**Key internal capabilities:**

| Capability | Implementation |
|-----------|---------------|
| **Fuzzy Matching** | Fuse.js with configurable threshold — handles typos, partial names, and spoken variations |
| **Quantity Parsing** | Understands "two", "a", "another", "three", numeric digits — extracts quantity + item text |
| **Session Persistence** | MongoDB Session model tracks `current_order`, `last_upsell`, `pending_clarification` |
| **Auto-Upsell** | After each new item is added, the best matching combo is suggested |
| **Clarification Flow** | Resolves generic category queries (e.g. "pizza") or multiple fuzzy matches → numbered prompt |
| **Order Modification** | Increase, decrease, set, or remove item quantities mid-order |
| **Add-On Modifiers** | Captures specific modifiers (e.g. extra cheese, large size) and reflects them in the order summary |

**Response Schema:**
```json
{
  "message": "Added 2x Classic Burger to your order.",
  "clarification": "Did you mean: 1) Classic Burger  2) Veggie Burger?",
  "upsell": "Want to add the Burger Meal Combo for ₹299? (Save ₹50!)",
  "order": {
    "items": [{ "name": "Classic Burger", "quantity": 2, "base_price": 180 }],
    "combos": []
  },
  "order_id": "uuid-string",
  "completed": true,
  "total": 360
}
```

---

### Menu Question AI (LLama 3 70B)

**File:** `voice-ai-assistant/ai/menuAssistantAI.js`

**Model:** `meta-llama/Meta-Llama-3-70B-Instruct` via HuggingFace Router API

**Purpose:** Answers free-form natural language questions about the menu — e.g.:
- "What combos do you have?"
- "Which items are vegetarian?"
- "What is the most popular item?"
- "What's the price of the Margherita Pizza?"

**Input:** Full menu context (all products + all combos) + user question

**Output:** A concise 1–3 sentence natural language response

**Question Detection:** `voice-ai-assistant/utils/isQuestion.js` uses keyword pattern matching. Keywords like `"which"`, `"suggest"`, `"recommend"`, `"menu"`, `"price"`, `"?"` route to the AI. Order-intent overrides (`"give me"`, `"i want"`, `"order"`, `"add"`) take priority over question detection.

**Fallback:** If HuggingFace API fails, the local LM Studio model (LLama 3.1 8B on `http://localhost:1234`) is used.

---

### Text-to-Speech (Sarvam AI)

**File:** `voice-ai-assistant/services/sarvamService.js`

**Model:** `bulbul:v3` | **Speaker:** `ritu` (female) | **Language:** `en-IN` (Indian English)

**How it works:**
1. Server receives text string
2. Makes a POST request to Sarvam AI API
3. Returns base64-encoded WAV audio data
4. Audio is played in the browser via the Web Audio API or saved as a file for Twilio

**Endpoint:** `POST /tts` with `{ "text": "Your order has been placed." }` → returns `{ "audio": "<base64-wav>" }`

**Used by:**
- Voice Order page (browser microphone flow)
- Twilio phone call flow (served as audio URL)
- `/test-sarvam` endpoint for development testing

---

### Twilio Phone Ordering Integration

**Files:** `voice-ai-assistant/controllers/twilioController.js`, `voice-ai-assistant/routes/twilioRoutes.js`

**Phone Number:** +1 (430) 249-1367

**Full Call Flow:**

```
1. Customer dials +1 (430) 249-1367
        │
        ▼
2. Twilio hits POST /twilio/voice
   → Server generates TwiML: "Welcome to PetPooja! What would you like to order?"
   → <Gather input="speech" language="en-IN" speechTimeout="auto">
        │
        ▼
3. Customer speaks their order
        │
        ▼
4. Twilio transcribes speech → hits POST /twilio/gather with SpeechResult
        │
        ▼
5. Server calls parseOrder(SpeechResult, phoneCallSID)
        │
        ├─→ Order incomplete → TTS response + new <Gather> for next input
        │
        └─→ Order confirmed → TTS confirmation + <Hangup />
```

**TTS strategy:**
- **Primary:** Sarvam AI generates audio, saved to `/public/audio/`, Twilio plays it via `<Play>` TwiML
- **Fallback:** If Sarvam fails, Twilio's built-in `<Say>` voice is used

---

### Authentication System

**Files:** `voice-ai-assistant/controllers/authController.js`, `voice-ai-assistant/routes/authRoutes.js`, `voice-ai-assistant/models/user.model.js`

The Voice AI server includes a complete authentication system for user accounts:

| Feature | Details |
|---------|---------|
| **Registration** | `POST /api/auth/register` — validates email uniqueness, hashes password with bcrypt, sends verification email |
| **Login** | `POST /api/auth/login` — validates credentials, issues JWT stored in an HTTP-only cookie |
| **Logout** | `POST /api/auth/logout` — clears the JWT cookie |
| **Email Verification** | `GET /api/auth/verify-email?token=...` — marks account as verified, token expires in 24 hours |
| **Security** | Passwords hashed with bcrypt; JWT in HTTP-only cookie (XSS-safe) |

---

### Gmail Order Notifications

**File:** `voice-ai-assistant/services/emailService.js`

Uses **Nodemailer** with Gmail SMTP to send transactional emails. Currently implements:

- **Email Verification:** Sends a styled HTML verification email with a secure token link when users register
- **Configuration:** Gmail SMTP on port 587 with TLS (STARTTLS) — requires a Gmail App Password

**Email template features:**
- Dark-themed HTML email body (matches app design)
- Gradient CTA button for email verification
- 24-hour token expiry notice
- Branded as "Voice AI Assistant"

---

## Owner Dashboard

**URL:** `http://localhost:5173` | **API Base:** `http://localhost:3001/api`

The Owner Dashboard is a React 19 + Vite 7 single-page app with a **6-tab navigation** layout, designed with a dark theme using DM Sans for UI text and JetBrains Mono for data values.

### Tabs Overview

| # | Tab | Component | What It Does |
|---|-----|-----------|-------------|
| 1 | **Analytics** | `ProductAnalytics.jsx` | Shows every product classified in a BCG quadrant matrix — with margin %, order frequency, revenue share, and colored classification badge |
| 2 | **Pricing** | `PricingDashboard.jsx` | Per-product pricing recommendations — current price vs. suggested price, change %, demand score, and one-click apply or manual customize |
| 3 | **Combos** | `ComboGenerator.jsx` | Click "Generate Combos" to run the AI combo engine — shows combo strategy type, items, score, profit margin — save to database with one click |
| 4 | **Manage** | `ManageCombos.jsx` | Browse all saved combos — overview stats + deep analytics modal showing per-item BCG, pairwise affinity labels, and customer savings % |
| 5 | **Upsell** | `SuggestView.jsx` | Select any product from a dropdown → instantly see ranked upsell suggestions with insight tags and compatibility scores |
| 6 | **Orders** | `Orders.jsx` | Full order management table — view all orders, inline-edit price/discount/channel, delete orders |

### Key UX Details

- **Pricing Dashboard:** Supports "Customize" mode — owner can adjust price and max discount before applying, overriding the AI suggestion
- **Combo Deep Analytics Modal:** Opens inline within `ManageCombos` — shows combo margin, customer savings, per-item breakdown, and pairwise buying pattern affinity labels
- **Toast Notifications:** All actions (apply pricing, save combo, delete) show success/error toast messages
- **Add/Remove Products:** Product Analytics page allows adding new products via modal and deleting existing products with a confirmation prompt

---

## User Dashboard

**URL:** `http://localhost:5174` | **Brand Name:** "Order & Dine"

The User Dashboard is a React 19 + Vite 7 app with a **5-tab navigation** layout, giving customers three distinct AI-powered ways to place an order.

### Session Management

Each visitor gets a persistent UUID stored in `localStorage` under the key `petpooja_session` (generated via `crypto.randomUUID()`). This session ID:
- Links all orders to the same user across all ordering channels (chat, voice, phone)
- Powers the "My Orders" tab — filtering to show only the current user's orders
- Persists across page refreshes and browser restarts

### Tab Persistence

All tabs remain **mounted in the DOM** using CSS `display: none` instead of conditional unmounting. This means chat history, voice transcripts, and in-progress orders survive tab switches without data loss.

### Tabs Overview

| # | Tab | Component | What It Does |
|---|-----|-----------|-------------|
| 1 | **Menu** | `Menu.jsx` | Browse all products and combos — category filter buttons (All / Main / Snack / Dessert / Beverages), product cards with image and price |
| 2 | **AI Chat** | `ChatOrder.jsx` | Conversational text ordering — type in natural language, bot responds, type "confirm" to place order |
| 3 | **Voice** | `VoiceOrder.jsx` | Tap mic → speak order → AI responds in audio — uses Web Speech API + Sarvam TTS |
| 4 | **Call** | `CallOrder.jsx` | Tap-to-call button for Twilio phone ordering + "How it works" guide |
| 5 | **My Orders** | `MyOrders.jsx` | Session-filtered order history with stats cards and expandable order detail cards |

### AI Chat Ordering (`ChatOrder.jsx`)

- Sends `{ sessionId, text }` to `POST http://localhost:3002/parse-order`
- Handles full conversation: order building → clarification prompts → upsell offers → confirmation
- Shows a system message with order ID and total amount on successful placement
- "New Order" button resets the chat — only available after the current order is confirmed

### Voice Ordering (`VoiceOrder.jsx`)

| State | Description |
|-------|-------------|
| **idle** | Mic button ready to tap |
| **listening** | Web Speech API active, recording |
| **processing** | Sending to `/parse-order`, waiting |
| **speaking** | Sarvam AI audio playing back |

- Speech recognition in `en-IN` locale
- TTS: Sarvam AI primary, `window.speechSynthesis` as fallback
- Auto-continues listening after AI response
- Full transcript history displayed during the session

### Phone Ordering (`CallOrder.jsx`)

- Calls the restaurant's Twilio number: **+1 (430) 249-1367**
- `<a href="tel:+14302491367">` for native phone dialer on mobile
- Step-by-step "How it works" guide explaining the phone AI ordering process

### My Orders (`MyOrders.jsx`)

- Fetches `GET http://localhost:3002/order/user/:userId` — loads authenticated user orders
- **Stats cards:** Total Orders placed, Total Amount Spent, Average Order Value
- **Expandable order cards** showing:
  - Order ID, channel badge (`voice` / `app` / `counter`), timestamp
  - Line items: quantity × product name + price
  - Combos listed with `(combo)` label
  - Subtotal, discount (if applied), and final total

---

## Scoring Formulas & Equations

Complete reference of all mathematical formulas used in the platform:

| # | Formula | Used In |
|---|---------|---------|
| 1 | $\text{Margin} = \text{sellingPrice} - \text{cost}$ | Product Analytics |
| 2 | $\text{Margin\%} = \frac{\text{sellingPrice} - \text{cost}}{\text{sellingPrice}} \times 100$ | Product Analytics |
| 3 | $\text{Order Frequency} = \frac{\text{orderCount}}{\text{totalOrders}}$ | Product Analytics |
| 4 | $\text{Revenue Share} = \frac{\text{productRevenue}}{\text{totalRevenue}} \times 100$ | Product Analytics |
| 5 | $\text{Support}(A,B) = \frac{\text{pairFreq}(A,B)}{\text{totalOrders}}$ | Association Mining |
| 6 | $\text{Confidence}(A \to B) = \frac{\text{pairFreq}(A,B)}{\text{freq}(A)}$ | Association Mining |
| 7 | $\text{Lift}(A,B) = \frac{\text{Support}(A,B)}{P(A) \times P(B)}$ | Association Mining |
| 8 | $\text{ComboScore} = 0.30A + 0.25P + 0.20S + 0.15C + 0.10D$ | Combo Generator |
| 9 | $\text{UpsellScore} = 0.40 \cdot \text{conf} + 0.25 \cdot \text{margin} + 0.20 \cdot \text{compat} + 0.15 \cdot \text{lift}$ | Upsell Engine |
| 10 | $\text{CompatScore} = \frac{1}{n} \sum S_{ij}$ | Combo Compatibility |
| 11 | $\text{comboMarginPct} = \frac{\text{comboPrice} - \text{totalCost}}{\text{comboPrice}} \times 100$ | Combo Deep Analytics |
| 12 | $\text{savingsPct} = \frac{\text{totalSelling} - \text{comboPrice}}{\text{totalSelling}} \times 100$ | Combo Deep Analytics |
| 13 | $\text{fullComboRate} = \frac{\text{ordersWithAllItems}}{\text{totalOrders}} \times 100$ | Combo Deep Analytics |
| 14 | $\text{demandScore} = \min(100,\ \text{orderFreq} \times 200)$ | Pricing Intelligence |
| 15 | $\text{minPrice} = \frac{\text{cost}}{1 - 0.20}$ | Pricing Intelligence |

---

## Category Compatibility Matrix

Used by the combo generator and upsell engine to score how well two food categories pair together. Scores range from 0 (poor pairing) to 1 (excellent pairing).

| | Main | Snack | Dessert | Beverages |
|--|------|-------|---------|-----------|
| **Main** | 0.20 | 0.90 | 0.50 | 0.95 |
| **Snack** | 0.90 | 0.30 | 0.40 | 0.90 |
| **Dessert** | 0.30 | 0.40 | 0.20 | 0.80 |
| **Beverages** | 0.95 | 0.90 | 0.80 | 0.20 |

**Key design decisions:**
- Same-category items are penalized (scores 0.2–0.3) — two mains or two desserts don't make a good combo
- **Main + Beverages (0.95)** — strongest pairing, mimics a classic meal deal
- **Main + Snack (0.90)** — natural add-on combination
- **Dessert + Beverages (0.80)** — solid post-meal pair
- **Dessert + Main (0.30)** — weak — customers don't typically want dessert with their main at the same time

---

## Product Classification Matrix

Products are classified using a **BCG-inspired 2×2 strategic matrix** based on two metrics: margin percentage and order frequency.

```
                        Order Frequency
                   Low (< 15%)        High (≥ 15%)
              ┌──────────────────┬──────────────────────┐
 High (≥ 50%) │   HIDDEN GEM     │        STAR          │
   Margin %   │  High profit,    │   High profit,       │
              │  low visibility  │   high demand        │
              ├──────────────────┼──────────────────────┤
  Low (< 50%) │      DOG         │    VOLUME TRAP       │
              │  Low profit,     │   High demand but    │
              │  low demand      │   low profit margin  │
              └──────────────────┴──────────────────────┘
```

| Classification | Margin % | Order Freq | Recommended Strategy |
|----------------|----------|------------|---------------------|
| ⭐ **Star** | ≥ 50% | ≥ 15% | Promote heavily, feature in combos, raise price slightly |
| 💎 **Hidden Gem** | ≥ 50% | < 15% | Boost visibility by pairing with Stars, lower price to stimulate demand |
| ⚠️ **Volume Trap** | < 50% | ≥ 15% | Raise price to recover margin or pair with high-margin items |
| 🐕 **Dog** | < 50% | < 15% | Consider discounting to clear or discontinuing entirely |

---

## License

This project is proprietary and developed as a final competition project for the PetPooja Revenue Intelligence platform. All rights reserved.
