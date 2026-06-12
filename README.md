# NestFinance — Personal Finance Tracker

A simple, browser-based finance tracker for salaried employees. Data is stored as `data/finance.xlsx` directly in this Git repository.

---

## 🚀 Setup (one-time)

### Step 1: Fork or clone this repo
```
https://github.com/YOUR_USERNAME/finance-tracker
```

### Step 2: Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Push any change to `main` — the site will deploy automatically

Your app URL: `https://YOUR_USERNAME.github.io/finance-tracker/`

### Step 3: Create a GitHub Personal Access Token
1. Go to https://github.com/settings/tokens/new
2. Give it a name (e.g. `finance-tracker`)
3. Expiration: 1 year (or no expiration)
4. Scopes: check **repo** (full control of private repositories)
5. Click **Generate token** and copy it

### Step 4: Open the app
1. Open your GitHub Pages URL
2. Paste your token, repo name (e.g. `yourname/finance-tracker`), and branch (`main`)
3. Click **Connect & Load Data**
4. On first run, the **Setup Wizard** opens — enter all your existing investments (pre-2026)

---

## 📊 How to use

### Adding income (IN)
Click **+ IN** → Choose type (Salary, Interest Received, etc.) → Enter amount

### Adding expense / investment (OUT)
Click **+ OUT** → Choose type (FD, LIC, Monthly Expense, etc.) → Enter amount

### Closing / breaking an investment
Go to **Investments** tab → Click **Close** next to any active investment → Enter the amount received and where the money went next

### Syncing data
Click **↑ Sync** to save all changes to the Excel file in your Git repo.  
Data auto-syncs after every add/close action.

---

## 📁 File structure
```
finance-tracker/
├── index.html          ← The app
├── css/style.css
├── js/
│   ├── data.js         ← State management + Excel parsing
│   ├── github.js       ← GitHub API (read/write Excel)
│   ├── ui.js           ← Modals, forms, setup wizard
│   └── app.js          ← Charts, rendering, dashboard
├── data/
│   └── finance.xlsx    ← Your data (auto-created on first sync)
└── .github/workflows/deploy.yml
```

### Excel sheets
| Sheet | Contents |
|---|---|
| `Transactions` | All IN/OUT entries from 2026 onwards |
| `Investments` | All investments (base + new), with status and break details |
| `Meta` | App settings (setup done flag, etc.) |

---

## 🔒 Security note
Your GitHub token is stored in your browser's `localStorage` — it never leaves your device.  
For a shared computer, clear browser data after use, or use an incognito window.

---

## Investment types tracked
- **IN**: Salary, Interest Received, Investment Return, Other Income
- **OUT – Investment**: FD, LIC, Stocks, Mutual Fund, PPF, PF, Business, Loan Given
- **OUT – Expense**: Monthly Expense, Other Expense
