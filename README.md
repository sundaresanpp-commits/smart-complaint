# CampusFix — AI-Powered Smart Complaint Management System

A full-stack MERN app for submitting, tracking, and resolving campus complaints, with AI-powered
categorization, priority scoring, sentiment analysis, duplicate detection, and admin summaries.

## What's included

**Core features**
- JWT authentication, role-based access (User / Staff / Admin)
- Submit complaints with title, description, category, location, image upload
- Status tracking: Submitted → Assigned → In Progress → Resolved → Closed, with a full timeline
- Admin assigns complaints to staff by department
- User feedback/rating after resolution
- In-app notifications on every status change (+ optional email via SMTP)

**AI features** (via OpenAI — see setup below)
- Auto-categorization of complaints
- Priority scoring (Low/Medium/High/Critical)
- Sentiment analysis (Calm/Concerned/Urgent/Distressed)
- Duplicate complaint detection (flags + links likely duplicates)
- AI-generated summary of all complaints for the admin dashboard

**Smart features**
- Interactive map of complaint locations (Leaflet) + toggleable heatmap of hotspots
- Advanced filters (status/category/priority/search) and complaint history
- Anonymous complaint submission
- Automatic escalation of complaints unresolved past a configurable threshold (runs hourly)

**Analytics dashboard**
- Totals by status, category, priority
- Monthly trend line chart
- Average resolution time
- Department performance table
- Export report as PDF or Excel

## ⚠️ Before you run this — read this section

This is a full working app, but a few things need YOUR input to run:

1. **MongoDB** — you need a running MongoDB instance. Easiest option: a free
   [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (takes ~5 min to set up),
   or install MongoDB locally.
2. **OpenAI API key** — the AI features (categorization, priority, sentiment, summary, duplicate
   detection) call OpenAI. **The app works without a key too** — it falls back to simple
   keyword-based logic automatically, so nothing crashes, but for the "wow factor" in your demo you
   want a real key. Get one at https://platform.openai.com/api-keys (a few dollars of credit is
   plenty for demo use).
3. **Node.js 18+** installed.

Budget real time to: install dependencies, set up Mongo, add your API key, run the seed script, and
click through every feature once before your demo. Treat this as a strong starting point, not a
zero-effort deliverable.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `OPENAI_API_KEY` — your OpenAI key (optional but recommended)

Seed demo data (creates an admin, a staff member, a student, and 7 sample complaints):

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 3. Log in

After seeding, use:
- **Admin**: admin@demo.com / password123
- **Staff**: staff@demo.com / password123
- **Student**: student@demo.com / password123

Or register a new account (registers as a regular user — staff/admin accounts are created by an
admin from the "Manage Staff" page).

## Project structure

```
backend/
  config/db.js              MongoDB connection
  models/                   User, Complaint, Notification schemas
  controllers/               auth, complaint, admin, notification logic
  routes/                    Express route definitions
  middleware/                JWT auth + role guard, image upload (multer)
  utils/aiService.js         OpenAI integration + fallback logic
  utils/notify.js            in-app notifications + optional email
  utils/escalationJob.js     hourly auto-escalation check
  utils/seed.js              demo data seeder
  server.js                  app entry point

frontend/
  src/pages/                 one file per screen (Dashboard, SubmitComplaint, Analytics, etc.)
  src/components/            Sidebar, Layout, TicketCard, Badges, ProtectedRoute
  src/context/AuthContext.jsx
  src/services/api.js        axios client with JWT interceptor
```

## Notes on scope / what's simplified

- **Images** are stored on local disk (`backend/uploads/`), not Cloudinary. This is simpler to run
  locally, but most free hosts (Render, Railway free tier, etc.) wipe local disk on redeploy. See
  "Swapping in Cloudinary" below if you need persistent image hosting.
- **Real-time updates** use polling (data reloads on page navigation/actions) rather than Socket.IO,
  to reduce moving parts for a 2-day build. If you want true real-time push updates, Socket.IO can be
  added on top of the existing notification system.
- **QR code verification** (listed as optional in the brief) is not included — it's a small addition
  if you want it (e.g. `qrcode` npm package generating a code from the complaint's `_id`).
- **Google Maps** — the map uses Leaflet + OpenStreetMap (free, no API key needed) instead of Google
  Maps, which requires a billing-enabled API key. Functionally equivalent for this use case.

## Swapping in Cloudinary (optional, for hosting)

1. `npm install multer-storage-cloudinary cloudinary` in `/backend`
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env`
3. Replace the `diskStorage` in `middleware/upload.js` with `CloudinaryStorage` per that package's
   docs, and store the returned `path`/`secure_url` as `imageUrl` instead of `/uploads/filename`.

## Deploying

- **Backend**: Render, Railway, or Fly.io (set the same env vars as `.env`)
- **Frontend**: Vercel or Netlify (set `VITE_API_URL` to your deployed backend URL + `/api`)
- **Database**: MongoDB Atlas (free tier is enough for a hackathon demo)

## Troubleshooting

- **"MongoDB connection error"** — check `MONGO_URI`, and that your IP is allowlisted in Atlas
  (Atlas → Network Access → Add Current IP, or `0.0.0.0/0` for demo purposes).
- **AI features return generic/fallback results** — check `OPENAI_API_KEY` is set correctly and has
  available credit. The app will still work without it (fallback keyword logic), just less
  impressively.
- **Images not showing** — confirm the backend is running and serving `/uploads` statically; check
  the browser console for a blocked/mixed-content request if deployed over HTTPS with an HTTP
  backend URL.
