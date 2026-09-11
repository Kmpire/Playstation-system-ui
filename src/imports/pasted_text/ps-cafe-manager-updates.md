Apply the following updates to the existing PS-Cafe Manager design.

---

## 1. Light / Dark Mode Toggle
Add a **light/dark mode switch** available on every screen, including the Console Dashboard. The user can toggle between the dark gaming theme and a light theme at any time; the selection should be reflected consistently across all screens.

## 2. Currency: EGP instead of $
Replace all currency symbols/references with **EGP**. Display format: **"150 EGP"** in English screens and **"150 ج.م"** in Arabic screens. Apply this everywhere a price appears (menu, POS, pricing settings, reports, session tabs).

## 3. Font: Cairo
Apply the **Cairo font family** across the entire app, for both English and Arabic text.

## 4. Larger Base UI Scale
Increase the **base font size and icon size** across all screens (general UI scale-up), optimized for desktop readability from a distance (common in café/POS environments).

## 5. Footer + Contact/About Page
- Add a **footer** at the bottom of the **Console Dashboard screen only**, containing: **company name, phone number, email, address, and social media links**.
- Additionally, add a new **"Contact / About"** item in the sidebar navigation — a dedicated page showing the same full company/contact information (name, phone, email, address, social links).

## 6. Snack Breakdown on Tab
On a console's active tab/bill, when the user **clicks a snack/drink line-item's price**, open a small popup/breakdown showing the **full list of all snacks/items added during that session**, with each item's name, quantity, and individual price.

## 7. Early-End Option for Fixed-Time Sessions
When ending a **Pre-paid (fixed-time)** session **before** the set time has elapsed, show an **End Session dialog with two choices**:
- **"Charge Full Amount"** — bill the full pre-paid fixed-time price
- **"Charge for Time Used"** — bill only for the actual elapsed time

## 8. Arabic Label Change
In the Arabic UI, change the word **"متعدد"** (used for the multiplayer session type) to **"مالتي"**.

## 9. Edit Fixed Time Mid-Session
Add an **"Edit Time"** action on an active fixed-time console session, allowing staff to **extend or shorten** the remaining fixed-time duration while the session is running.

## 10. "Reject" on Session-End Alert → Add New Time
On the **session-end alert** (from the existing fixed-time expiration alert), when staff clicks **"Reject"**, open the **"Add New Time"** panel so they can immediately start a new fixed-time block on that console.

## 11. Daily Total Next to Current Total
Show **both** of the following, side by side:
- On **each console card**: today's cumulative total for that console next to its current/live session total.
- On the **Daily Dashboard**: a **"Today's Total"** widget shown next to the existing **"Current/Live Total"** widget.

## 12. Add New Device
Add an **"Add Console"** button/action on the Console Dashboard, opening a form with: console name/number and console type (PS4 / PS5 / Xbox / VIP Room).

## 13. Data Management: Export / Import
Add a new **"Data Management"** section (sidebar or Settings) with two actions:
- **Export** — save a full snapshot of the database.
- **Import** — restore the database from the last saved snapshot (used, for example, after reinstalling the app).

## 14. Login / Logout
- Add a **Login screen** as the app's entry point, using username + password (the two fixed Admin/Cashier accounts already defined).
- Add a **Logout** action in the sidebar/header, available from any screen.

## 15. Shift Handover Report History
Add a **"Shift Reports"** history/list screen showing all previously submitted shift handover reports, filterable by **date** and **staff member** — separate from the existing "submit new shift report" form.

## 16. Controller Status + Add New
- Allow changing a controller's status among: **Working, Damaged, Under Repair, Retired**.
- Add an **"Add Controller"** button with an ID field to register a new controller into the shared pool.

## 17. Remove Customers & Tabs Feature
**Completely remove** the "Customers & Tabs" screen and its sidebar item, including all tabs/balance/loyalty-related UI.

## 18. Feedback on Adding Snacks / New Time
Show a **confirmation toast/notification** (e.g., "Item added ✓" / "Time added ✓") whenever a snack/drink is added to a tab or a new time block is added to a session.

## 19. Role-Based Visibility (Cashier restrictions)
The **Cashier** role should **not** see or access the following (in addition to the existing Reports restriction):
- Pricing Settings
- Staff & Shifts
- Data Management (Export/Import)
- Settings / Branding

## 20. Free Trial Lock (7 Days)
Add a **7-day free trial** behavior: after the trial period ends, show a **full-screen "Trial Expired"** message that **blocks all access** to the app, with a field to **enter a license/activation code** to unlock it.

## 21. Change Password
Add a **"Change Password"** option inside a **My Account / Settings** screen, available to both Admin and Cashier for changing their own account password.
