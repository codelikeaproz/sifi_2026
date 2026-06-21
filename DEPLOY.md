# Deploy SIFI Scholars

Production stack: **Vercel** (frontend) + **Render** (Django API) + **PostgreSQL** + **Cloudinary** (media).

Code changes for production are in the repo. Follow the steps below on each platform.

## Architecture

```
Browser → Vercel SPA → HTTPS → Render Web Service → PostgreSQL
                                              ↘ Cloudinary CDN
```

---

## 1. Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier).
2. Open the [Cloudinary Dashboard](https://console.cloudinary.com).
3. Copy **Cloud name**, **API Key**, and **API Secret**.
4. Save them — you will paste into Render env vars in step 3.

Upload paths use the `scholars/` folder from the Django models; no bucket setup required.

---

## 2. PostgreSQL

### Option A: Render PostgreSQL

1. Render Dashboard → **New +** → **PostgreSQL**
2. Name: `sifi-db`, region closest to your users
3. Plan: Free (or Starter if free is unavailable)
4. After creation, copy **Internal Database URL** (for the Render web service)
5. Save as `DATABASE_URL`

### Option B: Neon / Supabase (if Render DB unavailable)

1. Create a project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
2. Copy the Postgres connection string
3. Use the same string as `DATABASE_URL` on Render

---

## 3. Render backend

1. Render Dashboard → **New +** → **Web Service**
2. Connect GitHub repo: `codelikeaproz/sifi_2026`
3. Settings:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `./build.sh` |
| Start Command | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| Plan | Free |

4. Environment variables:

```
SECRET_KEY=<generate-random-50-char-string>
DEBUG=False
ALLOWED_HOSTS=sifi-api.onrender.com
DATABASE_URL=<from step 2>
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=<from Cloudinary>
CLOUDINARY_API_KEY=<from Cloudinary>
CLOUDINARY_API_SECRET=<from Cloudinary>
```

Replace `sifi-api.onrender.com` with your actual Render hostname. Replace the Vercel URL after step 4.

5. Deploy and wait for the build to finish.
6. Smoke test:
   - `GET https://<your-render-host>/api/scholars/` → JSON list
   - `POST https://<your-render-host>/api/auth/token/` with admin credentials

7. Create admin user (fresh database):

```bash
# Render Shell tab, or locally with DATABASE_URL set
python manage.py createsuperuser
python manage.py ensure_admin_profiles
```

**Free tier note:** Render free web services spin down after ~15 min idle; first request may take 30–60s.

---

## 4. Vercel frontend

1. [Vercel Dashboard](https://vercel.com) → **Add New Project**
2. Import `codelikeaproz/sifi_2026`
3. Settings:

| Setting | Value |
|---------|-------|
| Root Directory | `sifi_2026` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Environment variable:

```
VITE_API_URL=https://sifi-api.onrender.com
```

No trailing slash. Use your actual Render URL.

5. Deploy and note the URL (e.g. `https://sifi-2026.vercel.app`).
6. **Update Render CORS:** set `CORS_ALLOWED_ORIGINS` to your exact Vercel URL → redeploy backend.
7. Redeploy Vercel if you changed `VITE_API_URL`.

---

## 5. Post-deploy verification

| Check | Expected |
|-------|----------|
| Homepage loads on Vercel | Scholars grid/slider visible |
| Region filter + search | API calls hit Render (Network tab) |
| Images load | Cloudinary URLs in JSON (`imageSrc`) |
| Admin login `/admin/login` | JWT auth works |
| Create scholar with photo | Image appears on homepage |
| Head Officer RBAC | Region-scoped CRUD |
| Delete scholar/user | Toast + dialog work |

---

## Environment variables cheat sheet

| Where | Variable | Example |
|-------|----------|---------|
| Render | `SECRET_KEY` | random string |
| Render | `DEBUG` | `False` |
| Render | `ALLOWED_HOSTS` | `sifi-api.onrender.com` |
| Render | `DATABASE_URL` | `postgres://...` |
| Render | `CORS_ALLOWED_ORIGINS` | `https://sifi-2026.vercel.app` |
| Render | `CLOUDINARY_*` | from Cloudinary dashboard |
| Vercel | `VITE_API_URL` | `https://sifi-api.onrender.com` |

---

## Local development

Backend uses SQLite and local `media/` when `DATABASE_URL` and Cloudinary vars are unset. See `backend/.env.example` and `sifi_2026/.env.example`.

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (separate terminal)
cd sifi_2026
npm install
npm run dev
```

Default admin (local): `admin` / `admin123` (after `createsuperuser` + `ensure_admin_profiles`).

---

## What is NOT deployed

- `backend/db.sqlite3` — local dev only (gitignored)
- `backend/media/` — replaced by Cloudinary in production (gitignored)
- `sifi_2026/node_modules/` and `dist/` — built on Vercel
