# FormCraft — Fixes Applied

## 🐛 Bugs Fixed

### Backend

**1. Migrations not detected (root cause of 500 errors)**
- Old migrations had duplicate `initial = True` on both `0001` and `0002`
- `forms/0001_initial.py` had no dependency on `AUTH_USER_MODEL` — so Django couldn't link the `owner` FK
- `analytics` had split migrations that caused circular dependency
- **Fix:** Rewrote all migrations cleanly. `forms/0001_initial.py` now includes all models (Form, FormSettings, FormBranding) with `owner` FK in one migration.

**2. `forms` app name conflict with Django's built-in `django.forms`**
- Django has an internal `forms` module — having an app also named `forms` caused silent import errors
- **Fix:** Set `default_app_config` in each app's `__init__.py` and used full AppConfig paths in `INSTALLED_APPS`

**3. Empty `apps.py` files**
- `responses/apps.py` and `analytics/apps.py` were empty
- **Fix:** Added proper `AppConfig` classes to all apps

**4. `forms/migrations/0002_initial.py` was redundant**
- Caused "No changes detected" because Django sees two `initial=True` migrations
- **Fix:** Deleted 0002, merged everything into `0001_initial.py`

---

### Frontend

**5. `formsAPI.delete` — reserved word issue**
- `delete` is a JavaScript reserved word; using it as an object key can cause issues in some environments
- **Fix:** Renamed to `formsAPI.remove` in `api.js` and updated all callers

**6. `duplicateForm(slug).then(loadForms)` — async function not returning promise chain**
- The `.then()` call was unreliable because the function didn't always return the promise
- **Fix:** Used `async/await` consistently

---

## 🚀 Setup (after extracting this zip)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
python manage.py migrate     # Should now show ALL tables being created
python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```

**Expected migrate output should include:**
- `Creating tables: fc_users`
- `Creating tables: fc_forms, fc_form_settings, fc_form_branding`
- `Creating tables: fc_responses, fc_uploaded_files, fc_sessions`
- `Creating tables: fc_views`

If you still see issues, delete `db.sqlite3` and run `migrate` again.
