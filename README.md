# SpendSmart — Gmail Expense Tracker

A personal expense tracker that automatically imports transactions from Gmail and provides a spending dashboard with charts and category breakdowns. Sign in with any Google account.

## Features

- **Google Sign-In** — any Google account can log in; each user's data is private
- **Gmail sync** — Claude scans your Gmail for bank alerts, receipts, and e-commerce emails and imports them as expenses
- **Manual entry** — add, edit, or delete expenses at any time
- **Dashboard** — monthly totals, category donut chart, daily spending area chart, 6-month trend bar chart
- **Filters** — search by merchant/note, filter by category, month, and year
- **Multi-currency** — SGD, USD, EUR, GBP, MYR, JPY, AUD

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/JH1816/expense-tracker.git
cd expense-tracker
```

### 2. Get a Google OAuth Client ID

The app uses Google Sign-In, so you need a Client ID from Google Cloud.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Choose **Web application**
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
7. Click **Create** and copy the **Client ID**

### 3. Configure environment variables

Create `frontend/.env` (copy from the example below):

```bash
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Optionally set a stable secret key for session tokens on the backend:

```bash
export SECRET_KEY="a-long-random-string-of-your-choice"
```

---

## Running the app

### Option A — one command (recommended)

```bash
chmod +x start.sh
./start.sh
```

This installs all dependencies, starts the Flask backend on port 5000, and starts the Vite dev server on port 5173.

### Option B — manual (two terminals)

**Terminal 1 — backend:**

```bash
cd backend
pip install -r requirements.txt
python app.py
# Running on http://localhost:5000
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

---

## First-time login

1. Open http://localhost:5173
2. You will be redirected to the **Sign in** page
3. Click **Sign in with Google** and choose your Google account
4. You are now logged in — the app is ready to use

On the first login your account is created and default spending categories are seeded automatically.

---

## Syncing Gmail expenses

SpendSmart uses Claude's Gmail access to find transaction emails (bank alerts, e-receipts, ride-hail receipts, etc.) and import them automatically.

1. In the app, click **Sync Gmail** (top-right of Dashboard or Expenses page)
2. Follow the on-screen instructions — ask Claude:
   > "sync my Gmail expenses"
3. Claude will scan your inbox, parse amounts and merchants, and POST them to the app
4. Duplicates are detected by email ID and skipped automatically

Supported email types include UOB/HSBC/DBS bank transaction alerts, Google Pay receipts, Shopee order confirmations, Grab receipts, and most standard receipt formats.

---

## Project structure

```
expense-tracker/
├── backend/
│   ├── app.py            # Flask API (routes, auth, business logic)
│   ├── models.py         # SQLAlchemy models (User, Category, Expense)
│   ├── gmail_parser.py   # Amount extraction & category guessing helpers
│   ├── requirements.txt  # Python dependencies
│   └── expenses.db       # SQLite database (auto-created, git-ignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root layout, routing, auth guard
│   │   ├── api.js                     # Axios client with auth token injection
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Login state (localStorage-backed)
│   │   └── components/
│   │       ├── Login.jsx              # Google Sign-In page
│   │       ├── Dashboard.jsx          # Overview charts and stats
│   │       ├── ExpenseList.jsx        # Filterable expense table
│   │       ├── ExpenseModal.jsx       # Add / edit expense form
│   │       ├── GmailSyncModal.jsx     # Sync instructions modal
│   │       └── StatCard.jsx           # Reusable stat tile
│   ├── .env                           # VITE_GOOGLE_CLIENT_ID (you create this)
│   ├── package.json
│   └── vite.config.js                 # Dev server + /api proxy to Flask
└── start.sh                           # One-command startup script
```

---

## API reference

All routes (except `/api/auth/google`) require an `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/google` | Verify Google ID token, return session token |
| `GET` | `/api/auth/me` | Return current user's profile |
| `GET` | `/api/expenses` | List expenses (supports `month`, `year`, `category_id`, `search`, `source`, `limit`) |
| `POST` | `/api/expenses` | Create an expense |
| `PUT` | `/api/expenses/:id` | Update an expense |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `GET` | `/api/categories` | List categories (global defaults + user's custom ones) |
| `POST` | `/api/categories` | Create a custom category |
| `PUT` | `/api/categories/:id` | Update a category |
| `GET` | `/api/dashboard` | Dashboard data for a given `month` and `year` |
| `POST` | `/api/gmail/sync` | Bulk-import parsed expenses from Gmail scan |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · Flask · SQLAlchemy · SQLite |
| Auth | Google Identity Services (Sign In with Google) |
| Frontend | React 18 · Vite · React Router v6 |
| Styling | Tailwind CSS (dark theme) |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP | Axios |
