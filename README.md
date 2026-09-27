# Expense Tracker

Personal expense tracker — **FastAPI + SQLAlchemy + Alembic** backend and **Next.js 14 (App Router) + React 18 + TypeScript + Tailwind** frontend. Production-ready for Vercel + Render + Neon.

---

## Project layout

```
expense-tracker/
├── backend/       # FastAPI API
│   ├── app/
│   │   ├── api/v1/          # Routes (expenses, categories)
│   │   ├── crud/            # DB helpers
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── enums/           # Category enum
│   │   ├── config.py        # pydantic-settings
│   │   ├── database.py      # Engine, SessionLocal, get_db
│   │   └── main.py          # FastAPI app + CORS + error handler + /health
│   ├── alembic/             # Migrations
│   ├── Procfile             # Render start command (runs migrations + uvicorn)
│   ├── requirements.txt
│   └── .env.example
└── frontend/      # Next.js app
    ├── app/                 # App Router (page.tsx is a Server Component)
    ├── components/          # UI components
    ├── lib/                 # api client, formatters
    ├── types/               # Shared TS types
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── next.config.mjs
    └── .env.example
```

---

## Local development

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally (or Docker)

### 1. Backend (Terminal 1)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env — change the username in DATABASE_URL to match `whoami` on macOS
createdb expenses                       # one-time: create the Postgres DB
alembic upgrade head                    # run migrations (creates tables)
./.venv/bin/uvicorn app.main:app --reload --port 8000
```
Verify: http://localhost:8000/health → `{"status":"ok"}`
API docs: http://localhost:8000/docs

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
cp .env.example .env.local              # .env.local points at localhost:8000 by default
npm run dev
```
Open http://localhost:3000.

---

## Production deployment

You'll deploy three services and wire them together. Do them in this order.

### 1. Database — Neon (serverless Postgres)
1. Sign up at https://neon.tech and create a project (free tier works).
2. From the Neon dashboard, copy the **connection string** (PSQL URL). It will look like:
   ```
   postgresql://<user>:<password>@ep-xxx.<region>.aws.neon.tech/neondb?sslmode=require
   ```
   Replace the scheme prefix with `postgresql+psycopg2://` (SQLAlchemy needs it). If `?sslmode=require` isn't on the end, add it.
3. Save this string — you'll paste it into Render.

### 2. Backend — Render (Web Service)
1. Push this repo to GitHub.
2. In Render: **New → Web Service**, pick your repo.
3. Set these fields:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     (or just `web` if Render honors the Procfile, which it will)
4. In the **Environment Variables** section add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Neon URL from step 1, with `postgresql+psycopg2://` prefix and `?sslmode=require` |
   | `CORS_ORIGINS` | set to your frontend URL(s) later (you can update this after deploying Vercel; for now use `https://localhost:3000` as a placeholder, or your custom domain e.g. `https://expenses.yourdomain.com,https://your-project.vercel.app`) |
   | `PYTHON_VERSION` | `3.11.0` (optional, Render picks a sensible default) |
5. Click **Deploy**. Once it's live copy the backend URL, e.g. `https://expense-tracker-api.onrender.com`.
6. Verify: `curl https://<your-render-url>/health` returns `{"status":"ok"}`. (First cold start may take 30–60s.)

### 3. Frontend — Vercel
1. Go to Vercel → **Add New → Project**, import the same GitHub repo.
2. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detected)
3. In **Environment Variables** add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-url>/api/v1` |
4. Click **Deploy**.
5. When it finishes, Vercel gives you a URL like `https://your-project.vercel.app`.

### 4. Wire CORS between them
Go back to Render and update the `CORS_ORIGINS` env var to include your Vercel URL (and your custom Cloudflare domain later):
```
CORS_ORIGINS=https://your-project.vercel.app,https://expenses.yourdomain.com
```
Then click **Manual Deploy → Deploy latest commit** (or just redeploy).

### 5. Custom domain — Cloudflare
1. In Vercel, go to your project → **Settings → Domains** and add `expenses.yourdomain.com`. Follow Vercel's instructions to add the CNAME/ALIAS record.
2. In Render, add your API subdomain (e.g. `api.yourdomain.com`) as a Custom Domain in Render settings, and point your Cloudflare DNS record at Render.
3. Update Render's `CORS_ORIGINS` to include both the Vercel preview URL and your real domain.
4. In Vercel update `NEXT_PUBLIC_API_URL` to `https://api.yourdomain.com/api/v1` and redeploy.

Cloudflare proxy (orange cloud) works fine — just make sure SSL is set to "Full" in Cloudflare so HTTPS→HTTPS doesn't get stuck in a redirect loop.

---

## Common pitfalls
- **Neon URLs** require `?sslmode=require`; without it SQLAlchemy will hang or error.
- **CORS origins must match exactly** (scheme + host + port). `http://` vs `https://` counts as different.
- Render free tier **spins down after 15 minutes of inactivity** → first request is slow (30–60s cold start). Upgrade to a paid plan or use a cron job to keep it warm.
- On Vercel, Server Components render at build/request time on Vercel's servers, so `NEXT_PUBLIC_API_URL` must be publicly reachable (it can't be `localhost`).
- Never commit real `.env` / `.env.local` files. The repo only includes `.env.example` templates.

---

## Quick local sanity check
```bash
# Backend
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/categories
curl http://localhost:8000/api/v1/expenses

# Frontend
open http://localhost:3000
```
