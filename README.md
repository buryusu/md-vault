# MD Vault

A Next.js markdown knowledge base with authentication, payments, and a support ticket system.

## Features
- 🔐 **Auth** — Google & GitHub OAuth via NextAuth.js
- 📄 **File vault** — Browse, search, and read `.md` files
- 💎 **Monetization** — Free + paid docs, Stripe checkout
- 👑 **Admin panel** — Upload files (drag & drop or paste), manage users, grant/revoke admin
- 🎟️ **Tickets** — Built-in support ticket system with threaded replies

## Setup

### 1. Environment variables
Copy `.env.example` to `.env` and fill in all values.

### 2. Database
Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for a free Postgres instance.
Set `DATABASE_URL` to your connection string.

### 3. Auth providers
- **Google**: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
  - Redirect URI: `https://your-domain/api/auth/callback/google`
- **GitHub**: github.com → Settings → Developer settings → OAuth Apps
  - Callback URL: `https://your-domain/api/auth/callback/github`

### 4. Stripe (optional, for paid docs)
- Dashboard → Developers → API keys → `STRIPE_SECRET_KEY`
- Dashboard → Developers → Webhooks → add endpoint `/api/stripe/webhook` → `STRIPE_WEBHOOK_SECRET`

### 5. Admin access
Add your email to `ADMIN_EMAILS` env var before first login.

## Deploy on Render
The app is already deployed. To update, push to your repo — Render will auto-deploy.

Build command: `npm install && prisma generate && prisma db push --accept-data-loss && next build`
Start command: `next start`

> Note: this project uses `prisma db push` rather than migrations, so no manual migration step is needed — the schema syncs to your database automatically on each deploy.
