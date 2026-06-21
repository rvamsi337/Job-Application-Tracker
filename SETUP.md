# Setup Guide

This guide is the practical setup checklist for running and deploying the Job Tracker app safely.

## 1. What You Need
- Node.js and npm for the frontend
- Java 21
- Maven
- A Supabase project
- Optional later: Vercel, Render, and Google Drive backup

## 2. Local Files You Must Create
Create these files from the examples:

- `backend/.env` from `backend/.env.example`
- `frontend/.env` from `frontend/.env.example`

These real `.env` files are ignored by Git and should stay private.

## 3. Backend Local Setup
Open [backend/.env.example](/c:/PROJECTS/MIT%20Project%20Web/backend/.env.example) and copy it into `backend/.env`.

Fill in:

```env
SUPABASE_DB_URL=jdbc:postgresql://db.<project>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-password
CORS_ALLOWED_ORIGINS=http://localhost:5173
GOOGLE_DRIVE_BACKUP_ENABLED=false
```

Notes:
- `SUPABASE_DB_URL` is the JDBC connection string
- `SUPABASE_DB_USERNAME` is usually `postgres`
- keep Google Drive backup disabled unless you intentionally configure it

Run backend:

```powershell
cd backend
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

## 4. Frontend Local Setup
Open [frontend/.env.example](/c:/PROJECTS/MIT%20Project%20Web/frontend/.env.example) and copy it into `frontend/.env`.

Set:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Run frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 5. Local Verification
Check:
- backend starts without DB errors
- frontend loads
- dashboard opens
- manual job add works
- job upload works
- recruiter page works

## 6. Tests
Backend:

```powershell
cd backend
mvn test
```

Frontend:

```powershell
cd frontend
npm test
npm run build
```

## 7. GitHub Role
GitHub stores code, not secrets.

Push:
- `frontend/`
- `backend/`
- `README.md`
- `SETUP.md`
- `.env.example` files

Do not push:
- `frontend/.env`
- `backend/.env`
- service account credentials
- database passwords

## 8. Production Deployment
### Frontend on Vercel
- import repo from GitHub
- set root directory to `frontend`
- add env:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

### Backend on Render
- create a web service from GitHub
- set root directory to `backend`
- choose runtime: `Docker`
- Render will use [backend/Dockerfile](/c:/PROJECTS/MIT%20Project%20Web/backend/Dockerfile)
- add envs from backend `.env`

Important:
- production secrets are entered directly in Render and Vercel dashboards
- they do not come from GitHub
- if Render does not show a native `Java` runtime, this Docker setup is the correct deployment path

## 9. Supabase Notes
Supabase is the main cloud database.

That means:
- your data does not depend on your laptop
- Google Drive backup is optional extra protection only

## 10. Google Drive Backup
Default recommendation:

```env
GOOGLE_DRIVE_BACKUP_ENABLED=false
```

Only enable backup if you are comfortable configuring Google Cloud + Google Drive API.

If enabled, backend also needs:
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

## 11. HTTPS
Local development normally uses:
- `http://localhost:5173`
- `http://localhost:8080`

Production HTTPS is handled by hosting:
- Vercel gives frontend HTTPS
- Render gives backend HTTPS

## 12. Safe Workflow
1. Run locally with Supabase only
2. Keep Google backup off
3. Push code to GitHub
4. Deploy frontend to Vercel
5. Deploy backend to Render
6. Add production env vars in hosting dashboards
7. Test production URLs
8. Add Google Drive backup later only if needed
