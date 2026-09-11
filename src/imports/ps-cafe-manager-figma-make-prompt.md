# PS-Cafe Manager — Figma Make Prompt

Design a **desktop-only web application** for managing a PlayStation/gaming café. The app has **one user role using the UI: Admin** (a separate Cashier login exists at the account level, but the Cashier role has no access to the Reports screen — otherwise identical permissions to Admin). Support both **English (LTR)** and **Arabic (RTL)** layouts. Visual style: a **dual-mode design** — the Console Dashboard and active-session screens use a **dark, gaming-themed UI** (deep background, neon/accent highlights, console-card grid feel); the POS/Sales, Menu Management, Pricing, Reports, Staff, Inventory, and Customer screens use a **light, clean POS style** (bright background, clear typography, table-friendly). Both styles should share the same typography and iconography family so the app still feels like one product.

Design **all of the following screens**, fully clickable/navigable via a persistent left sidebar: Console Dashboard, POS / Sales, Menu Management, Pricing Settings, Reports, Staff & Shifts, Inventory, Controllers & Maintenance, Customers & Tabs.

---

## 1. Console Dashboard (dark gaming theme)

- Grid layout showing **3 console cards per row**, wrapping to additional rows; the grid area **scrolls vertically** if there are more consoles than fit on screen.
- Each console card shows: console name/number, console type icon (PS4 / PS5 / Xbox / VIP Room), and a **status color state**:
  - 🟢 **Available** (green)
  - 🔵 **Occupied** (blue)
  - 🟡 **Paused** (yellow)
  - 🔴 **Maintenance** (red, locked/greyed out — see Section 8)
  - **Reserved** (distinct 5th color/pattern, e.g. purple or striped)
- On an **Occupied** card, show in real time: elapsed/remaining time, current running cost (live, updating continuously — not just calculated at session end), and single/multiplayer indicator.
- **Starting a session** (tap an Available card) opens a start-session panel with:
  - Mode toggle: **Pre-paid (Fixed Time)** vs **Post-paid (Open Time)**
  - For Pre-paid: duration entry supports **both** a manual minutes/hours input field **and** quick preset buttons (30 min / 1 hr / 2 hr)
  - Single-player / Multi-player rate toggle
- **Session end alert (Pre-paid):** when time expires, show **all** of the following simultaneously — a visual flashing/highlighted state on the console card, a full-screen or prominent popup/toast alert, and a sound/audio cue icon (indicate an audio alert plays).
- **Mid-session rate change:** the Single/Multi toggle can be changed while a session is active. When changed, the bill splits into two line items — one for the Single-player rate period and one for the Multi-player rate period — both visible in the session's running tab.
- **Pause:** a Pause button stops the cost timer (cost does not accrue while paused); card switches to the Paused (yellow) state. A Resume button restarts billing.
- **Transfer:** a Transfer action lets staff move an active session to another console, but **only if the target console is Available**. On transfer, elapsed time and accumulated cost carry over exactly (no reset).
- **Quick Tab Addition:** each console card has a button/icon that opens a small menu-item picker popup (drinks/snacks) to add items directly to that console's running tab, without leaving the dashboard.
- Console card also shows a small tab-total indicator once food/drink items have been added.

---

## 2. POS / Sales (light clean theme) — separate screen

- A standalone screen, separate from the Console Dashboard, for selling items to walk-in customers not tied to any console session.
- Menu browsable by category (see Section 3), grid of item tiles with image, name, price.
- Cart/order panel on the side showing selected items, quantities, subtotal, total.
- **Payment method: cash only** — a single "Complete Sale — Cash" checkout action (no card/wallet options in the UI).
- Receipt/confirmation view after checkout.

---

## 3. Menu Management (light clean theme)

- Table/grid view of all menu items with columns: image, name, category, price, stock quantity, cost price.
- Add / Edit / Delete item actions, each opening a form with fields: **name, category (dropdown), price, image upload, stock quantity, cost price** (cost price used for profit calculations in Reports).
- **Categories are fully custom** — an "Add Category" action lets Admin create/rename/delete categories freely (no fixed hardcoded list).

---

## 4. Pricing Settings (light clean theme)

- Rates are configured **per console type** (PS4, PS5, Xbox, VIP Room), not per individual console.
- For each console type, show two rate fields: Single-player hourly rate and Multi-player hourly rate.
- **No minimum charge field** — omit any minimum-time/minimum-fee setting.
- **Flat rate only** — no day/night or weekday/weekend rate variation fields.

---

## 5. Reports & Analytics

### 5a. Daily Dashboard (light clean theme, could be the default landing/home screen)
Show these widgets exactly:
- Total revenue today
- Total active hours today
- Top 5 selling items (list/mini chart)
- Active vs. idle consoles count (e.g., "7 active / 5 idle")
- Current cash in drawer

### 5b. Periodic Reports
- Filters/tabs for **Daily / Weekly / Monthly** report views.
- Each report shows gross revenue, **net profit/loss** (calculated as revenue minus manually-entered expenses — no automatic cost-of-goods deduction from inventory cost price for this calculation), and usage statistics (session counts, active hours, top items).
- An **"Export as PDF"** button on each report view.

---

## 6. Staff & Shifts (light clean theme)

- **Login:** simple username + password. Exactly **two fixed accounts** exist — one Admin, one Cashier — both **provisioned by the developer** (no in-app "create new staff account" flow needed in this UI).
- **Roles:** Admin and Cashier have identical access **except** the Cashier role cannot open the Reports screen (hide/disable that sidebar item for Cashier).
- **Shift Handover screen:** a form/summary shown at end of shift with fields: **counted cash** (manual entry), **system-expected cash** (auto-calculated, read-only), a **variance/discrepancy** display, and a **notes** text field. A "Submit Shift Report" action saves it.
- **Audit Trail:** a dedicated log-viewer screen (Admin-only) listing every logged action (e.g., cancelled sessions, deleted items, price changes) with columns: timestamp, staff member, action type, details. Include filter controls for **staff member, date range, and action type**.

---

## 7. Inventory (light clean theme)

- Applies to **both** cafe consumables (drinks/snacks, from Menu Management) **and** physical assets (controllers, consoles).
- Table view: item/asset name, category, current stock/quantity, low-stock threshold, status.
- **Manual quantity editing only** — no dedicated "restock workflow" with supplier/cost tracking; just an editable quantity field per item.
- **Low stock alert:** appears as a **banner at the top of the main Dashboard** when any item falls at/below its reorder threshold (not a separate alerts page, not a notification bell).

---

## 8. Controllers & Maintenance (light clean theme)

- Controllers are tracked as a **shared pool**, assignable to any console (not permanently linked to one console).
- Controller list: controller number/ID, current assignment (if any), condition status.
- **Maintenance history** per controller and per console: a log of records with fields — **date, issue description, cost, resolved by**.
- **Maintenance Mode toggle** on a console: when enabled, the console card on the Dashboard becomes **greyed out and locked** (still visible in the grid, but not selectable/startable) and shows a "Maintenance" red-state badge.

---

## 9. Customers & Tabs (light clean theme)

- Customer list/table with fields: **name, phone, photo (optional), balance owed, credit limit (optional feature — can be left blank/unset)**.
- **Customer Tabs:** a tab can span **multiple visits/sessions** before being paid off, maintaining a running balance per customer over time (mark this as an optional/secondary feature in the UI, e.g. a toggle to enable tabs for a customer).
- **Offers & Promos:** promotions (e.g., "Play 3 hours, get 1 free") are **not automatic** — staff apply them manually via a **promo code entry field or a promo button** during checkout/session billing.

---

## General UI Notes
- Persistent left sidebar navigation across all screens with icons + labels for: Dashboard, POS/Sales, Menu, Pricing, Reports, Staff & Shifts, Inventory, Controllers & Maintenance, Customers & Tabs.
- Support full RTL mirroring of the entire layout (sidebar, tables, forms, icons) when Arabic is selected, in addition to a standard LTR English mode.
- Design is desktop-only — no mobile/tablet breakpoints required.
- This brief describes UI/UX only (screens, layout, states, interactions); no backend/data-model implementation is required from Figma Make.
