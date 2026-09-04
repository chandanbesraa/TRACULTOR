# TRACULATOR 🚜
> **Tagline**: *Track Time. Calculate Earnings.*

**TRACULATOR** is a complete, clean, professional, mobile-first Tractor Work Time, Customer, and Earnings Management System designed for agricultural tractor contractors and field operators working outdoors under direct sunlight.

---

## 🌟 Key Features & Capabilities

### 1. 👤 Customer Login & Sign Up (Supabase Authentication)
- **Simple, Hassle-Free Sign Up**: Operators create an account and log in using **only**:
  1. **Email or Mobile Phone Number**
  2. **Password** (min 6 characters)
- **Profiles Table (`public.profiles`)**: Stores user profile information (`id: uuid`, `name: text`, `phone: text`, `email: text`, `address: text`, `created_at`, `updated_at`).
- **Automatic Profile Creation Trigger**: A PostgreSQL trigger automatically creates the `profiles` record upon registration in `auth.users`.
- **No Usernames or Public Handles Required**: Fast and straightforward authentication for field operators.
- **Row Level Security (RLS)**: Strict Supabase RLS database policies ensure each authenticated user can only view, insert, and update their own profile and job records.
- **Hidden Database ID**: The internal UUID `id` is purely a database reference and is never exposed in the UI.

### 2. 📱 Profile Experience
- **Clickable Header Tractor Logo**: Tapping the TRACULATOR tractor icon in the top header immediately opens the Customer Profile.
- **Bottom Navigation Profile Icon**: Direct access via the 5th tab in bottom navigation.
- **Operator Details**: Avatar initial, full name, mobile number, email, field/village address, default rate (₹/min), and authenticated status badge.
- **Lifetime Performance Stats**: Total completed jobs, total working hours, and cumulative net profit.
- **Profile Management**: In-place profile editor (Name, Phone, Email, Address, Default Rate) and secure logout modal.

### 3. 🛡️ Isolated Admin Portal
- **Strict Customer/Admin Separation**: The Admin link, button, and pages are **completely hidden and inaccessible** from the Customer App.
- **Direct Portal Route**: Accessible only via **[http://localhost:3000/#admin](http://localhost:3000/#admin)**.
- **Default Master Admin Credentials**:
  - **Admin Email / ID**: `admin@traculator.in` *(or `admin`)*
  - **Admin Password**: `admin123`
- **Multi-Source Data Aggregation**: Aggregates registered accounts and jobs from Supabase and local storage.
- **Platform Monitoring & Finances**:
  - Global Platform Overview KPIs (*Total Accounts, Completed Jobs, Platform Income, Total Expenses, Net Earnings*).
  - All Accounts Directory table with search, contact details, address, job count, and billing totals.
  - All Jobs Explorer with customer filter, timer mode filter, search, and instant PDF invoice downloads.

### 4. ⛅ Live Agricultural Weather
- Integrated directly into the main bottom navigation.
- **Live Outdoor Meteorology**: Current temperature, feels like, condition icon, and humidity % (soil moisture indicator).
- **Tractor Operation Advisories**:
  - **Crop Spraying Safety**: Alerts if wind speeds exceed 20 km/h to prevent chemical/pesticide drift.
  - **Field Ploughing / Rotavator**: Recommendations based on precipitation and soil conditions.
- **Location Support**: GPS Geolocation button + quick selector for Indian agricultural districts.
- **5-Day Agricultural Forecast**: Daily highs, lows, rain probability %, and maximum wind speeds.

### 5. 📜 Direct History + Monthly View (Side-by-Side Tabs & Swipe)
- Side-by-side tabs in a single screen: `[ ⏱️ HISTORY | 📊 MONTHLY ]`.
- **One-Tap Switching**: Direct header tab toggle without extra sub-pages.
- **Touch Gesture Support**: Smooth left/right horizontal swipe between History and Monthly.
- **History View**: Search bar, date grouping, single-record delete buttons, and PDF bill downloads.
- **Monthly View**: Dynamic current month detection, 5 monthly KPI cards, monthly PDF report export, and itemized job records.

### 6. ⚙️ 3 Main Tractor Operation Modes
- **Stopwatch Mode**: Start, pause, resume, live accrued earnings (`₹/min × elapsed time`), and end work.
- **Count Down Mode**: Circular gauge timer with +/− 1m immediate adjustment buttons, early completion, and completion chime.
- **Manual Mode**: Enter Start/End date & time manually, rate per minute, with automatic duration and billing calculations.

### 7. 💾 Guaranteed APK & Offline Data Storage
- **Dual-Layer Persistence**: All job records and customer queues write immediately to device storage (`localStorage` & universal sandbox key).
- **Offline Resilience**: App functions and saves completed sessions even before or without logging into Supabase.
- **Cloud Synchronization**: Syncs automatically to Supabase PostgreSQL when connected.

### 8. ❌ Cancel / Don't Save Session Discard
- Dedicated button in Stopwatch and Countdown modes as well as the **Job Completed!** summary screen.
- Asks for confirmation and cleanly discards the session without saving anything to History, Today's Jobs, Queue, or PDF.

### 9. 🔢 0-Replacing Number Inputs
- Number inputs show `0` by default; when typed into, the `0` is replaced automatically (e.g. typing `25` results in `25`, never `025`).

### 10. 📄 Professional PDF Bill & Invoice Generator
- Single-page formatted tractor work receipts with customer name, work description, field location, rate (₹/min), itemized expenses (diesel, driver, food, other), net earnings, and contractor signature area.
- Fixed bounding boxes to prevent any currency symbol or amount text overflow.

---

## 🎨 High-Visibility Outdoor Color Palette

- **Background**: `#F7F7F5` (High-contrast neutral)
- **Primary Green**: `#1F5E3B` (Deep agricultural green)
- **Secondary Green**: `#3F7D4C`
- **Cards**: `#FFFFFF` (Clean white cards with crisp borders)
- **Main Text**: `#1A1A1A` (High contrast outdoor readability)
- **Currency**: `₹` (Indian Rupee)

---

## 🗄️ Database Setup (Supabase)

The application connects to Supabase for PostgreSQL database storage and authentication.

1. Configure your environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://kmrynklzoakzdjuddbsm.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_rXPUO-1zS9gwXbawu1U3QQ_sg2NEg7p
   ```
2. Run the SQL schema from [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor to provision:
   - `profiles` table with automatic user creation trigger
   - `jobs` table
   - `customer_queue` table
   - Row Level Security (RLS) policies

---

## 🚀 Getting Started

### Installation
```bash
# Clone or navigate to the project directory
cd traculator

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 📱 Navigation Structure

- **Customer App**:
  - **Header**: Clickable Tractor Logo (opens Profile), TRACULATOR title, Tagline, Date.
  - **1. 📖 Diary**: Live tractor timer, active customer card, 5 summary KPI cards, and today's finished jobs.
  - **2. 📜 History**: Unified side-by-side `[ HISTORY | MONTHLY ]` tabs with touch swipe.
  - **3. ➕ Add Customer**: Customer setup form with rate and preferred timer mode.
  - **4. ⛅ Weather**: Live agricultural weather & field operation advisories.
  - **5. 👤 Profile**: Profile details (Name, Phone, Email, Address, Default Rate), Lifetime Stats, and Edit Form.

- **Admin Portal**:
  - Dedicated route at **`http://localhost:3000/#admin`** for platform monitoring and multi-customer records.
