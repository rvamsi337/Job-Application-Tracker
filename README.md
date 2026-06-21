# Job Tracker Website

Personal job-tracking app with a React + Tailwind frontend and a Spring Boot backend. It supports job-link uploads, duplicate detection, manual entries, recruiter management, application status tracking, filtering, exports, and optional daily Google Drive backups.

## Stack
- Frontend: React, Vite, Tailwind CSS, React Query
- Backend: Spring Boot, Spring Data JPA, Flyway
- Database: Supabase PostgreSQL
- Hosting: Vercel for frontend, Render for backend
- Optional backup: Google Drive via Google Drive API

## Main Features
- Upload `.txt` files with one job link per line
- Detect duplicates and store them separately from the main applications list
- Add manual job links
- Track statuses: `PENDING`, `APPLIED`, `NOT_RELEVANT`, `SAVED`
- Filter applications by date, status, and search text
- Bulk-update application statuses
- Paginate the applications list with configurable page size
- Export filtered applications and recruiters as CSV
- Manage recruiter contacts with recruiter name, email, and optional mobile
- View dashboard totals for total applications, last 7 days, and today
- Optional daily Google Drive backup files:
  - `YYYY-MM-DD-job-links.csv`
  - `YYYY-MM-DD-recruiters.csv`
  - `YYYY-MM-DD-summary.json`

## Project Structure
- `frontend/`: React application
- `backend/`: Spring Boot API
- [SETUP.md](/c:/PROJECTS/MIT%20Project%20Web/SETUP.md): step-by-step setup and deployment guide

## Environment Files
Real secrets should stay only in local `.env` files or hosting dashboards.

- Backend template: [backend/.env.example](/c:/PROJECTS/MIT%20Project%20Web/backend/.env.example)
- Frontend template: [frontend/.env.example](/c:/PROJECTS/MIT%20Project%20Web/frontend/.env.example)

Do not commit:
- `backend/.env`
- `frontend/.env`
- Google service account JSON files

## Local Development
### Backend
1. Copy `backend/.env.example` to `backend/.env`.
2. Fill in Supabase values.
3. Keep `GOOGLE_DRIVE_BACKUP_ENABLED=false` unless you intentionally configure Google Drive backup.
4. Run:

```powershell
cd backend
mvn spring-boot:run
```

Backend default URL:

```text
http://localhost:8080
```

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env`.
2. Set `VITE_API_BASE_URL=http://localhost:8080`.
3. Run:

```powershell
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## Testing
### Backend
```powershell
cd backend
mvn test
```

### Frontend
```powershell
cd frontend
npm test
npm run build
```

## Database
The app uses Supabase PostgreSQL as the primary cloud database. Flyway runs automatically and creates the schema on startup.

Current core tables include:
- `job_applications`
- `duplicate_job_links`
- `recruiter_contacts`

## Deployment Summary
### Frontend on Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Required env:
  - `VITE_API_BASE_URL=https://your-backend.onrender.com`

### Backend on Render
- Root directory: `backend`
- Build command: `mvn clean package`
- Start command:

```text
java -jar target/job-tracker-api-0.0.1-SNAPSHOT.jar
```

- Required envs come from [backend/.env.example](/c:/PROJECTS/MIT%20Project%20Web/backend/.env.example)

## Google Drive Backup
Google Drive backup is optional. The app works without it.

If you want backups:
- create a Google Drive folder
- create a Google Cloud project
- enable Google Drive API
- create a service account
- share the Drive folder with the service account email
- set backup env vars in the backend

If you want to avoid any Google Cloud setup or billing risk for now, leave:

```env
GOOGLE_DRIVE_BACKUP_ENABLED=false
```

## API Endpoints
- `POST /api/jobs/upload`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/duplicates`
- `PATCH /api/jobs/{id}/status`
- `GET /api/dashboard/stats`
- `GET /api/recruiters`
- `POST /api/recruiters`
- `PATCH /api/recruiters/{id}`
- `DELETE /api/recruiters/{id}`
- `POST /api/recruiters/upload`
