# 💸 Finlytics

> **Track Smarter • Budget Better • Analyze Everything**

A full-stack personal finance tracker built with a vanilla JS frontend and a Node.js/Express REST API backed by MongoDB. Features JWT authentication, real-time budget alerts, analytics, PDF export, CSV import, and full PWA support.

---

## ✨ Features

| Category | Details |
|---|---|
| **Auth** | Register & login with JWT-protected sessions |
| **Transactions** | Add, edit, delete — with category, type, and date filters |
| **Budget Tracking** | Set budgets per category with real-time overspend alerts |
| **Analytics** | Spending breakdowns, trends, and summaries |
| **Import / Export** | CSV import, PDF export |
| **UX** | Dark/Light theme, skeleton loaders, toast notifications |
| **PWA** | Installable, works offline via Service Worker |
| **Security** | Helmet, CORS, rate limiting (100 req / 15 min per IP), bcrypt passwords |

---

## 🗂 Project Structure

```
finlytics/
├── backend/
│   ├── middleware/
│   │   └── validation.js      # Joi input validation
│   ├── models/
│   │   ├── User.js            # User schema (bcrypt password hashing)
│   │   └── Transaction.js     # Transaction schema
│   ├── routes/
│   │   └── api.js             # All REST endpoints
│   ├── server.js              # Express app entry point
│   ├── .env                   # Environment variables (never commit this)
│   └── package.json
├── frontend/
│   ├── index.html             # Single-page app shell
│   ├── script.js              # All frontend logic
│   ├── style.css              # Styles (dark/light theme)
│   ├── sw.js                  # Service Worker (PWA)
│   └── manifest.json          # PWA manifest
├── Dockerfile
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) v4+ (local or Atlas)
- [Docker](https://www.docker.com/) *(optional — for the one-command setup)*

---

### Option A — Docker (Recommended)

Spins up MongoDB + the backend API together with a single command.

```bash
git clone https://github.com/your-username/finlytics.git
cd finlytics

# Edit the JWT secret before running in production
docker-compose up --build
```

The API will be available at `http://localhost:5000`.  
Then serve the frontend (see [Serving the Frontend](#serving-the-frontend) below).

---

### Option B — Manual Setup

**1. Start MongoDB**

Make sure a MongoDB instance is running locally on port `27017`, or grab a free connection string from [MongoDB Atlas](https://www.mongodb.com/atlas).

**2. Configure environment variables**

```bash
cd backend
cp .env .env.local   # or edit .env directly
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finlytics
JWT_SECRET=replace_this_with_a_long_random_secret
NODE_ENV=development
```

> ⚠️ **Never commit your real `.env` to version control.** Add `.env` to your `.gitignore`.

**3. Install dependencies and start the API**

```bash
cd backend
npm install
npm start          # production
# or
npm run dev        # development (auto-restart via nodemon)
```

The API will be running at `http://localhost:5000`.  
You can verify it with:

```bash
curl http://localhost:5000/health
```

---

### Serving the Frontend

The frontend is plain HTML/CSS/JS — no build step needed.

**Locally (VS Code Live Server / any static server):**

```bash
# From the project root
npx serve frontend
# or
cd frontend && python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

> The backend's CORS config already allows `localhost:3000`, `localhost:8000`, and `127.0.0.1:5500` in development.

---

## 🌐 API Reference

Base URL: `http://localhost:5000/api`

All routes except auth require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Create account |
| `POST` | `/auth/login` | ❌ | Login, get JWT |
| `GET` | `/transactions` | ✅ | List transactions (filterable) |
| `POST` | `/transactions` | ✅ | Add transaction |
| `PUT` | `/transactions/:id` | ✅ | Update transaction |
| `DELETE` | `/transactions/:id` | ✅ | Delete transaction |
| `GET` | `/analytics` | ✅ | Spending summaries |
| `GET/POST` | `/budget` | ✅ | Get or set budgets |
| `GET` | `/health` | ❌ | Server health check |

---

## ☁️ Hosting Guide

### Frontend — Netlify / Vercel (Free, Recommended)

The frontend is a static site and deploys instantly to any CDN.

**Netlify:**
1. Go to [netlify.com](https://www.netlify.com/) → *Add new site → Deploy manually*
2. Drag and drop the `frontend/` folder
3. Done — you'll get a live URL immediately

**Vercel:**
```bash
npm i -g vercel
cd frontend
vercel
```

**Before deploying**, update the API base URL in `frontend/script.js` from `localhost:5000` to your production backend URL.

---

### Backend — Railway (Easiest)

1. Push your project to GitHub
2. Go to [railway.app](https://railway.app) → *New Project → Deploy from GitHub*
3. Select the repo; Railway auto-detects Node.js
4. Add environment variables under *Settings → Variables*:
   ```
   MONGODB_URI=<your Atlas URI>
   JWT_SECRET=<your secret>
   NODE_ENV=production
   PORT=5000
   ```
5. Railway gives you a public URL — plug that into your frontend's API config

---

### Backend — Render (Free Tier Available)

1. Go to [render.com](https://render.com) → *New → Web Service*
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`, **Build Command** to `npm install`, **Start Command** to `npm start`
4. Add the same environment variables as above

---

### Database — MongoDB Atlas (Free)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Whitelist `0.0.0.0/0` (or your server's IP) under *Network Access*
3. Create a database user and copy the connection string into `MONGODB_URI`

---

### Production CORS Update

Once you have a live frontend URL, update `backend/server.js`:

```js
origin: ['https://your-frontend.netlify.app']
```

---

## 🔒 Security Checklist Before Going Live

- [ ] Change `JWT_SECRET` to a random 64-character string
- [ ] Use MongoDB Atlas with a strong DB password
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS `origin` to your real frontend domain
- [ ] Never commit `.env` — add it to `.gitignore`

---
\
## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, PWA |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose 7 |
| Auth | JWT (`jsonwebtoken`), bcryptjs |
| Validation | Joi, express-validator |
| Security | Helmet, express-rate-limit, CORS |
| DevOps | Docker, Docker Compose |
