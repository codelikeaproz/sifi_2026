# sifi_2026

SIFI Scholars website — public scholar showcase with admin CRUD, region filters, and role-based access control.

## Structure

- `sifi_2026/` — React + Vite frontend
- `backend/` — Django REST API

## Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_admin_profiles
python manage.py runserver
```

### Frontend

```bash
cd sifi_2026
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/media` to `http://127.0.0.1:8000`.
