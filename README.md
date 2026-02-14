# AI Newsletter Generator

AI-powered newsletter generator — tech stack foundation.

## Tech stack

| Layer        | Tech | Purpose |
|-------------|------|---------|
| **Frontend** | Next.js (App Router) + Vercel | Website, login, newsletter builder & preferences (frequency, categories, sources) |
| **Auth**     | Supabase Auth | Google OAuth + Email/Password |
| **Database** | Supabase | User data, preferences, newsletter config |
| **Backend**  | Node.js + Express on Railway | Scrape, DB access, generate newsletter, send email at scheduled time |

## Repo structure

```
├── src/                    # Next.js app (frontend)
│   ├── app/                # App Router pages & layout
│   └── lib/supabase/       # Supabase client (browser + server + middleware)
├── backend/                # Railway server
│   ├── src/
│   │   ├── index.ts        # Express app, health check
│   │   ├── lib/supabase.ts # Server Supabase client (service role)
│   │   └── jobs/           # Placeholder: scrape, generate, send
│   ├── railway.json
│   └── nixpacks.toml
├── supabase/
│   ├── config.toml         # Local Supabase config (optional)
│   └── migrations/         # SQL migrations
├── .env.local.example      # Frontend env template
├── vercel.json             # Vercel deployment
└── README.md
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Google** and **Email**.
3. For Google: add OAuth credentials (Google Cloud Console) and set Client ID/Secret in Supabase.
4. In **Project Settings → API** copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL` (frontend) and `SUPABASE_URL` (backend)
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (backend only; keep secret)

### 2. Frontend (Next.js)

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

npm install
npm run dev
```

Runs at [http://localhost:3000](http://localhost:3000). Deploy to **Vercel**: connect repo and add the same env vars.

### 3. Backend (Railway)

```bash
cd backend
cp .env.example .env
# Edit .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
```

Runs at [http://localhost:3001](http://localhost:3001). Health: `GET /health`.

Deploy to **Railway**:

1. New project → Deploy from GitHub.
2. Root directory: set to `backend` (or add `backend` as a service).
3. Add variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and any `PORT` Railway sets.
4. Railway will build (`npm run build`) and start (`npm start`) automatically.

## Next steps (when you build the app)

- **Frontend**: Auth UI (login/signup with Google + email), newsletter builder, preference screens (frequency, categories, sources).
- **Backend**: Scrape service, newsletter generation (e.g. AI API), email sender (Resend, SendGrid, etc.), cron or scheduler for “send at user-specified time.”
- **Supabase**: Tables for users/preferences/sources and migrations in `supabase/migrations/`.

## Scripts

| Where   | Command        | Description        |
|--------|----------------|--------------------|
| Root   | `npm run dev`  | Next.js dev server |
| Root   | `npm run build`| Next.js production build |
| Backend| `npm run dev`  | Express dev (tsx watch) |
| Backend| `npm run build`| Compile TypeScript |
| Backend| `npm start`    | Run compiled server |
