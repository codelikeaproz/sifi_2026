# Deploy SIFI Scholars



Production stack: **Vercel** (frontend) + **Render** (Django API) + **Supabase** (PostgreSQL) + **Cloudinary** (media).



Code changes for production are in the repo. Follow the steps below on each platform.



## Architecture



```

Browser → Vercel SPA → HTTPS → Render Web Service → Supabase PostgreSQL

                                              ↘ Cloudinary CDN

```



---



## 1. Cloudinary



1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier).

2. Open the [Cloudinary Dashboard](https://console.cloudinary.com).

3. Copy **Cloud name**, **API Key**, and **API Secret**.

4. Save them — you will paste into Render env vars in step 3 (never commit secrets to git).



Upload paths use the `scholars/` folder from the Django models; no bucket setup required.



---



## 2. PostgreSQL (Supabase)



Supabase offers a **free tier** (500 MB storage). Free projects may pause after ~1 week of inactivity and wake on the next connection.



No backend code changes are needed — Django reads `DATABASE_URL` via `dj-database-url`.



### Option A: Supabase (recommended)



1. Go to [supabase.com](https://supabase.com) → **Start your project** (free).

2. **New project**

   - Name: e.g. `sifi-scholars`

   - Database password: generate a strong one and **save it** (you cannot recover it later)

   - Region: **Southeast Asia (Singapore)** — closest to PH users

3. Wait ~2 minutes for the project to provision.

4. Open **Project Settings** (gear) → **Database**.

5. Under **Connection string**, choose:

   - **URI** tab

   - **Session pooler** (recommended for Django on Render)

6. Copy the string. It looks like:



   ```

   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

   ```



7. Replace `[YOUR-PASSWORD]` with the password you saved in step 2.

8. Paste the full string as **`DATABASE_URL`** in Render → Web Service → **Environment** (step 3 below).



**Important:** Do not paste this URL into git or this file — Render env vars only.



### Option B: Render PostgreSQL (fallback)



1. Render Dashboard → **New +** → **PostgreSQL**

2. Name: `sifi-db`, region closest to your users

3. Plan: Free (or Starter if free is unavailable)

4. After creation, copy **Internal Database URL** (for the Render web service)

5. Save as `DATABASE_URL`



### Supabase troubleshooting



| Issue | Fix |

|-------|-----|

| Build fails on `migrate` with `Network is unreachable` for `db.<project-ref>.supabase.co` | Use the **Session pooler** URI, not the Direct connection URI. The direct Supabase host can resolve to IPv6, which Render may not reach. |

| `SSL connection required` | Append `?sslmode=require` to the end of `DATABASE_URL` |

| Connection timeout after idle | Free tier may be paused — retry; first request can take 30–60s |

| Auth failed | Wrong password in URI — reset in Supabase → Database → Reset database password |

| Migrations fail on pooler | Use **Session pooler** (port `5432`), not **Transaction pooler** (port `6543`) |



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

DATABASE_URL=<Supabase Session pooler URI from step 2>

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

| School / Degree masters | Search, create, and rename work within the selected region |

| Year Graduated | Optional for existing scholars; saves for new or edited scholars |

### School / Degree migration rollout

This release keeps legacy `Scholar.school` and `Scholar.degree_name` text fields for compatibility while adding:

- region-scoped `School` master records
- region-scoped `Degree` master records
- nullable `Scholar.school_ref`
- nullable `Scholar.degree_ref`
- nullable `Scholar.year_graduated`

After deploying:

1. Run `python manage.py migrate`
2. Verify a sample of existing scholars still shows the correct school and degree values
3. Create a new scholar using an existing school/degree and confirm the picker reuses the record
4. Create a new scholar with a brand new school/degree and confirm the new master record appears in `/admin/reference-data`
5. Rename a school/degree in `/admin/reference-data` and confirm linked scholars display the updated name
6. Leave `Year Graduated` blank for an existing scholar edit to confirm old records remain valid

Do not remove legacy text fields in the same deploy. Plan the cleanup as a separate migration only after production data has been verified.

---



## Environment variables cheat sheet



| Where | Variable | Example |

|-------|----------|---------|

| Render | `SECRET_KEY` | random string |

| Render | `DEBUG` | `False` |

| Render | `ALLOWED_HOSTS` | `sifi-api.onrender.com` |

| Render | `DATABASE_URL` | `postgresql://postgres.[ref]:...@...pooler.supabase.com:5432/postgres` |

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