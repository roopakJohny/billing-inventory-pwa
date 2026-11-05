# Billing & Inventory Management PWA (`Smart POS`)

A complete, responsive Progressive Web Application (PWA) for Billing (POS), Batch-Based Inventory Management (FEFO/FIFO), Supplier & Sales Returns, Expiry/Damage Monitoring, and Business Analytics.

---

## Application Modules

- **Authentication & Role-Based Access Control**
  - Authentication (`login`, `logout`, `me`, `forgot-password`, `reset-password`, `change-password`)
  - Configurable Role-Based Access Control (`ADMIN`, `MANAGER`, `STAFF`) with an interactive Role Permissions Matrix UI
  - Business Settings (`INR ₹` default, GSTIN, Invoice Prefix, FEFO/FIFO batch strategy, Low-stock & Expiry alert thresholds, and Reset Demo Database)
  - Security & Operational Audit Trail
- **Product & Inventory Management**
  - Product Catalog CRUD, SKU/Barcode lookup, CSV Bulk Import, and product batch/movement history
  - Category Management with category-wise stock valuation and sales performance
  - Supplier Management with GSTIN, purchase history ledger, and outstanding payable payment recording
  - Stock Purchases with batch creation, manufacturing/expiry dates, and purchase/selling prices
  - Authorized Stock Adjustments (`ADDITION`, `DEDUCTION`, `DAMAGE`, `EXPIRY`, `WRITE_OFF`, `AUDIT_CORRECTION`) with mandatory reason and movement ledger
- **Billing / POS**
  - Fast POS Terminal with barcode scanner input, category filter pills, automatic FEFO/FIFO batch deduction, item & bill discounts, GST calculations, and split/multi-method payments (`CASH`, `UPI`, `CARD`, `BANK_TRANSFER`)
  - Printable thermal receipt (80mm/58mm) & PDF invoice download
  - Bills & Sales History with due payment collection and bill cancellation with automatic batch stock reversal
- **Returns & Expiry Management**
  - Sales Return Management with mandatory condition classification (`GOOD_CONDITION`, `DAMAGED`, `EXPIRED`, `QUARANTINE`)
  - Stock Return to Supplier workflow (`DRAFT` → `PENDING` → `SUBMITTED` → `ACCEPTED` / `REJECTED` / `PARTIALLY_ACCEPTED` / `COMPLETED`) with immediate removal from sellable inventory and credit note tracking
  - Dedicated Expiry & Damaged Stock Monitoring (Expired, Expiring in ≤7, ≤15, ≤30 days, Damaged, and Quarantine inspection release/write-off)
- **Reports & Analytics**
  - Dynamic Dashboard with 13 KPIs, live stock/expiry alerts, and Recharts visualizations (Daily sales vs returns, Monthly sales trend, Top-selling products, Category distribution)
  - Sales, Batch Inventory Valuation, and Financial Gross Profit reports with 1-click export to **CSV**, **Excel (`.xls`)**, and **PDF**
- **PWA & Standalone Browser Engine**
  - Web App Manifest (`manifest.webmanifest`), Service Worker (`sw.js`), Install PWA prompt, Online/Offline status indicator
  - Standalone client-side persistence & business engine (`src/services/localBackendEngine.ts`) + IndexedDB Offline POS Queue (`src/services/offlineDb.ts`)

---

## Quick Start Instructions

```bash
cd d:/billing-inventory-pwa
npm install
npm run dev
```
- **Application URL**: `http://localhost:5173`

### Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@store.com` | `Password@123` |
| **Manager** | `manager@store.com` | `Password@123` |
| **Staff / Cashier** | `cashier@store.com` | `Password@123` |
