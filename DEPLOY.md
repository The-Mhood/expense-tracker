# Step-by-step Deployment: Local → GitHub → Neon → Render → Vercel → Cloudflare

We will set up 4 services in order. Do them in this exact sequence — each step depends on the previous one.

---

## Step 0: Prerequisites (make sure you have these accounts)

- GitHub account (free): https://github.com
- Neon account (free Postgres): https://neon.tech
- Render account (free backend hosting): https://render.com — sign up with GitHub
- Vercel account (free Next.js hosting): https://vercel.com — sign up with GitHub
- Cloudflare account (free DNS/custom domain): https://cloudflare.com
- A domain name (optional — you can use the free *.vercel.app and *.onrender.com URLs if you don't have one)

---

## Step 1: Put the code on GitHub

1. Download `expense-tracker.zip` from this workspace and **unzip** it on your Mac. You'll get an `expense-tracker/` folder containing `backend/`, `frontend/`, `README.md`, `DEPLOY.md`, etc.
2. Go to https://github.com/new
3. **Repository name:** `expense-tracker`
4. **Visibility:** Public (or Private — Vercel and Render both work with private repos)
5. **Do NOT** check any of the "Initialize with…" boxes (no README, no .gitignore, no license — those are already in the folder)
6. Click **Create repository**
7. On the next screen, copy the commands from the "…or push an existing repository from the command line" section (they look like this):
   ```bash
   cd /path/to/expense-tracker        # cd into the folder you unzipped
   git init -b main
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
   git push -u origin main
   ```
   Paste those into your terminal one by one.
8. Refresh the GitHub page — you should see all your files (backend/, frontend/, etc.).

---

## Step 2: Create the database on Neon

1. Go to https://neon.tech and sign in.
2. Click **New Project**.
3. **Project name:** `expense-tracker`
4. **Postgres version:** leave as default (16)
5. **Region:** pick the closest one to you (e.g. **US East (Ohio)** if you're on the US east coast, **EU Central (Frankfurt)** for Europe). Vercel and Render should be in similar regions for speed.
6. Click **Create project**.
7. After it provisions, you'll land on a page with a **Connection string** that looks like this:
   ```
   postgresql://neondb_owner:abc123XYZ@ep-xxx-yyy.zzzzzz.aws.neon.tech/neondb?sslmode=require
   ```
8. **Copy that string.** Now modify it for SQLAlchemy: replace the `postgresql://` prefix with `postgresql+psycopg://` (adds "+psycopg" so SQLAlchemy uses the psycopg v3 driver). It will look like:
   ```
   postgresql+psycopg://neondb_owner:abc123XYZ@ep-xxx-yyy.zzzzzz.aws.neon.tech/neondb?sslmode=require
   ```
9. **Save this string somewhere safe** (Notes.app, a text file) — you'll paste it into Render in Step 3. You'll also need the Neon password once; if you lose it you can reset it on the Neon dashboard under **Dashboard → Roles**.

---

## Step 3: Deploy backend to Render

1. Go to https://dashboard.render.com and log in with GitHub.
2. Click **New +** → **Web Service**.
3. Click **Configure account** if this is your first time, and authorize Render to access your GitHub repos.
4. Find your `expense-tracker` repo in the list and click **Connect**.
5. Fill in the form **exactly** as follows:
   - **Name:** `expense-tracker-api` (this becomes part of your URL, e.g. `expense-tracker-api.onrender.com`)
   - **Region:** pick the **same region as Neon** (very important for latency)
   - **Branch:** `main`
   - **Root Directory:** `backend`   ← critical! Render must deploy from the backend/ subfolder.
   - **Runtime:** `Python 3`
   - **Build Command:** `bash render-build.sh`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free ($0/month) is fine for this
6. Open the **Advanced** section (or click "Create Web Service" and then add env vars on the next screen) and add these **Environment Variables**:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Step 2.8 (starting with `postgresql+psycopg://...` ending with `?sslmode=require`) |
   | `CORS_ORIGINS` | leave as default for now: `http://localhost:3000` (we'll update this after Vercel gives us a URL) |
   | `PYTHON_VERSION` | `3.11.9` |

7. Click **Create Web Service** (or **Save**).
8. Render will start building. You can watch the logs. It takes 2–4 minutes. Wait until you see:
   ```
  ==> Starting service with 'uvicorn app.main:app --host 0.0.0.0 --port $PORT'
   Application startup complete.
   Uvicorn running on http://0.0.0.0:10000
   ```
9. Test it: click the URL at the top of the Render page (something like `https://expense-tracker-api-xxxx.onrender.com`). Append `/health` — so the full URL is `https://expense-tracker-api-xxxx.onrender.com/health`. You should see:
   ```json
   {"status":"ok"}
   ```
   Also try `/api/v1/categories` — should return the category list.
10. **Copy your backend URL** (without `/health`) — e.g. `https://expense-tracker-api-xxxx.onrender.com`. You'll need it in Step 4.

> ⚠️ The free tier of Render spins down after 15 minutes of inactivity. The first request after that takes 30–60 seconds to cold-start. That's normal.

---

## Step 4: Deploy frontend to Vercel

1. Go to https://vercel.com/new (log in with GitHub).
2. Find your `expense-tracker` repo in the **Import Git Repository** list and click **Import**.
3. Fill in:
   - **Project Name:** `expense-tracker` (becomes part of your URL)
   - **Framework Preset:** Next.js (it will auto-detect this)
   - **Root Directory:** `frontend`   ← critical! Vercel must deploy from the frontend/ subfolder.
   - Leave Build/Install/Output commands as defaults (they auto-detect).
4. Open **Environment Variables** and add:

   | Key | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://expense-tracker-api-xxxx.onrender.com/api/v1` (use YOUR Render URL from Step 3.10) | Production, Preview, Development (check all three) |

5. Click **Deploy**. Wait 1–2 minutes.
6. When you see the 🎉 celebration screen, click the preview URL (something like `https://expense-tracker-abc123.vercel.app`).
7. **It will probably show "Could not reach server" right now.** That's expected — we need to tell Render's CORS to allow this Vercel origin.

---

## Step 5: Fix CORS on Render

1. Copy your Vercel URL from Step 4.6 (e.g. `https://expense-tracker-abc123.vercel.app`).
2. Go back to your Render Web Service → **Environment** tab.
3. Find the `CORS_ORIGINS` variable, click the three dots → **Edit**.
4. Change its value to:
   ```
   http://localhost:3000,https://expense-tracker-abc123.vercel.app
   ```
   (replace with your actual Vercel URL).
5. Click **Save Changes**. Render will auto-redeploy (takes ~1 minute).
6. Once the deploy shows "Live", go back to your Vercel site and hard-refresh (Cmd+Shift+R).
7. The expenses page should now load correctly (empty list with "No expenses yet" — because Neon is a fresh database). Add an expense to confirm it works end-to-end.

---

## Step 6 (optional): Add a custom domain with Cloudflare

If you want your app on something like `https://expenses.yourdomain.com` instead of the `vercel.app` URL:

### 6.1 Buy/register a domain if you don't have one
You can buy one through Cloudflare, Namecheap, GoDaddy, etc. If you already have a domain skip this.

### 6.2 Add the domain to Cloudflare (skip if your domain is already there)
1. In Cloudflare → **Add a Site** → enter your domain → pick the **Free** plan.
2. Cloudflare will give you two nameservers (e.g. `xxx.ns.cloudflare.com`). Go to your domain registrar (where you bought the domain) and change the domain's nameservers to those two. It can take 10–60 minutes to propagate.

### 6.3 Point the root or a subdomain to Vercel
1. In Vercel → your project → **Settings → Domains** → enter `expenses.yourdomain.com` (or whatever subdomain you want) → click **Add**.
2. Vercel will give you a CNAME target like `cname.vercel-dns.com`.
3. In Cloudflare → your domain → **DNS** → **Add record**:
   - Type: `CNAME`
   - Name: `expenses`
   - Target: `cname.vercel-dns.com`
   - Proxy status: **Proxied** (orange cloud)
   - TTL: Auto
4. Back in Vercel, the domain should turn green with a "Valid Configuration" checkmark within a few minutes.

### 6.4 (optional) Point an API subdomain to Render
If you also want `https://api.yourdomain.com` instead of the `onrender.com` URL:
1. In Render → your backend service → **Settings → Custom Domains** → Add `api.yourdomain.com`.
2. Render will give you a CNAME target (something like `expense-tracker-api.onrender.com`).
3. In Cloudflare DNS → **Add record**:
   - Type: `CNAME`
   - Name: `api`
   - Target: `expense-tracker-api.onrender.com` (your actual Render URL without `https://`)
   - Proxy: Proxied (orange)
4. Wait for Render to verify the domain (turns green).
5. Update `CORS_ORIGINS` in Render to include the new frontend domain:
   ```
   https://expenses.yourdomain.com,http://localhost:3000
   ```
6. Update `NEXT_PUBLIC_API_URL` in Vercel env vars to `https://api.yourdomain.com/api/v1` and redeploy.

### 6.5 Cloudflare SSL setting (important!)
In Cloudflare → your domain → **SSL/TLS**, set the encryption mode to **Full** (not "Flexible"). Full/Strict is fine too. Flexible will cause infinite redirect loops with Vercel/Render because both already serve HTTPS.

---

## Step 7: Verify everything works end-to-end

1. Open your Vercel (or custom) domain in a browser.
2. Add an expense — it should appear immediately.
3. Refresh — it should still be there (persisted in Neon).
4. Edit an expense — save and refresh; the change should stick.
5. Delete an expense — it should disappear.
6. Filter by category — totals should update.
7. Open on your phone (on the same WiFi/cell data) — works.

---

## Troubleshooting checklist

| Symptom | Fix |
|---|---|
| Vercel shows "Could not reach server" / CORS error in Network tab | Render's `CORS_ORIGINS` doesn't include your Vercel URL; see Step 5. Redeploy Render after changing it. |
| Render build fails with "No matching distribution found" | Check Python version — set `PYTHON_VERSION=3.11.9` in Render env vars. |
| Render logs: "connection failed" / "password authentication failed" | `DATABASE_URL` is wrong. Recopy from the Neon dashboard. Make sure it has `?sslmode=require` at the end. |
| First request to Render takes 30s | Free-tier cold start — normal. Upgrade to paid plan or use a free uptime ping service if this annoys you. |
| Vercel build fails with "NEXT_PUBLIC_API_URL is missing" | Add the env var to Vercel (Production AND Preview), then redeploy. |
| `ERR_CERT_AUTHORITY_INVALID` / SSL errors on your custom domain | Cloudflare SSL/TLS mode is "Flexible"; set it to "Full". |
| Alembic says "relation expenses already exists" or "no such table" | Delete DB and re-run `alembic upgrade head` locally. On Neon you can drop tables via the Neon SQL editor, or just create a new Neon project. |
