# N3RDY Intelligence

AI-powered market intelligence platform. Monitor hundreds of news sources, get real-time sentiment analysis, and receive AI-generated executive briefings — before the market moves.

Live at **[n3rdy.info](https://n3rdy.info)**

---

## What It Does

N3RDY continuously ingests RSS feeds from financial news sources (Reuters, Bloomberg, FT, WSJ, CNBC, and more), runs each article through AI analysis, and surfaces the signal:

- **Sentiment tracking** — bullish/bearish/neutral scoring across categories in real time
- **AI briefings** — Claude-generated executive intelligence reports on demand
- **Trending topics** — velocity-weighted topic detection across your feed
- **Watchlist** — track specific companies, sectors, keywords, and assets
- **Economic calendar** — macro events with AI-generated market context
- **Source management** — start with 19 curated defaults, add your own RSS feeds

---

## Dashboard Sections

| Section | Description |
|---|---|
| Overview | Stat cards, sentiment chart, top stories |
| Briefings | AI executive reports with risk signals and outlook |
| News Feed | Paginated articles from your sources |
| Sentiment | Bullish/bearish breakdown by category |
| Trending | Hot topics ranked by velocity |
| Watchlist | Tracked companies, assets, keywords |
| Economic Calendar | Upcoming macro events and impact scores |
| Sources | Add, remove, and prioritise RSS feeds |
| Settings | Account and preferences |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.5 |
| Auth | NextAuth v5 — Google OAuth |
| Database | PostgreSQL via [Neon](https://neon.tech) + Prisma ORM |
| Cache / Queue | Redis (Upstash) + BullMQ |
| AI — Primary | Anthropic Claude `claude-opus-4-8` |
| AI — Fallback 1 | OpenAI `gpt-4o` |
| AI — Fallback 2/3 | Google Gemini `gemini-2.5-flash` (two keys) |
| Feed parsing | `rss-parser` |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Hosting | Firebase App Hosting (Cloud Run, `us-east4`) |
| Notifications | Firebase / FCM |

---

## Data Models

```
User ──┬── UserPreferences
       ├── UserSource ── Source
       ├── WatchlistItem
       ├── Briefing
       ├── Alert ── Notification
       └── (via Source) Article ── ArticleAnalysis
                                └── ArticleEntity ── Entity

TrendingTopic
EconomicEvent
```

Key models:
- **Source** — RSS feed URL, category, region, trust score, bias tag
- **Article** — title, URL, full text, deduplicated by SHA-256 hash of URL
- **ArticleAnalysis** — sentiment score, market impact score, urgency, risk level, sectors affected, key facts, entities, second-order effects
- **Briefing** — full JSON briefing content with executive summary, top stories, risk signals, 7-day outlook

---

## API Routes

```
POST /api/ingest/run          Fetch RSS feeds + AI-analyse new articles
GET  /api/articles            Paginated article feed (filter by category, sentiment, impact)
GET  /api/sources             List user's sources
POST /api/sources             Add a custom source
PATCH /api/sources            Toggle active / update priority
DELETE /api/sources           Remove a source
GET  /api/sentiment           Aggregated sentiment by category
GET  /api/trending            Trending topics ranked by velocity
GET  /api/briefings           List briefings
POST /api/briefings           Generate a new AI briefing (inline, ~20s)
PATCH /api/briefings          Mark briefing as read
GET  /api/watchlist           List watchlist items
POST /api/watchlist           Add item
DELETE /api/watchlist         Remove item
GET  /api/economic-calendar   Upcoming macro events
GET  /api/cron/ingest         Cron-triggered ingestion endpoint
GET  /api/debug/status        Auth-protected diagnostics
GET  /api/admin/migrate       One-shot runtime DB migration (protected by CRON_SECRET)
```

---

## AI Fallback Chain

All AI calls (article analysis and briefing generation) cascade through providers automatically:

```
1. Claude claude-opus-4-8   (Anthropic)
        ↓ credits exhausted / quota / overloaded
2. GPT-4o                   (OpenAI)
        ↓ any failure
3. Gemini 2.5 Flash         (Google — key 1)
        ↓ any failure
4. Gemini 2.5 Flash         (Google — key 2)
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Upstash](https://upstash.com) Redis instance
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Setup

```bash
git clone <repo-url>
cd n3rdy
npm install
```

Create `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

DATABASE_URL=postgresql://...@neon.tech/nerdydb?sslmode=require
REDIS_URL=rediss://...upstash.io:6379

ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=<any random string>

# Optional fallbacks
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AQ.Ab8...
GEMINI_API_KEY_2=AQ.Ab8...

# Firebase (from Firebase console → Project settings → Web app)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

Apply the database schema:

```bash
npx prisma migrate deploy
```

Start the dev server:

```bash
npm run dev
```

---

## Deployment

Hosted on **Firebase App Hosting** (Cloud Run). All secrets are stored in **GCP Secret Manager** and injected at runtime — never committed to the repository.

Push to the `website` branch to build. Rollouts are triggered manually via the Firebase App Hosting REST API or the Firebase console.

### Production secrets required in GCP Secret Manager

```
DATABASE_URL          NEXTAUTH_SECRET       GOOGLE_CLIENT_ID
REDIS_URL             ANTHROPIC_API_KEY     GOOGLE_CLIENT_SECRET
CRON_SECRET           OPENAI_API_KEY        GEMINI_API_KEY
GEMINI_API_KEY_2      NEXT_PUBLIC_FIREBASE_*  (8 variables)
```

### First-deploy checklist

1. Push to `website` branch and create a rollout
2. Sign in to the app — sources are seeded automatically on first login
3. Click **Refresh Feed** in the dashboard to trigger the first ingest
4. Click **Generate Now** in Briefings to produce your first executive report

---

## Project Structure

```
app/
├── page.tsx                  Landing page
├── dashboard/                Protected dashboard pages
│   ├── page.tsx              Overview
│   ├── briefings/
│   ├── news/
│   ├── sentiment/
│   ├── trending/
│   ├── watchlist/
│   ├── calendar/
│   ├── sources/
│   └── settings/
└── api/                      API routes (see list above)

components/dashboard/         Dashboard UI components
lib/
├── ai.ts                     Claude / OpenAI / Gemini with fallback chain
├── db.ts                     Prisma client singleton
├── queue.ts                  BullMQ queue definitions
└── firebase.ts               Firebase client

prisma/
├── schema.prisma             Full data model
└── migrations/               SQL migration history
```

---

## Roadmap

- [ ] Scheduled ingest (Firebase Scheduled Functions or external cron)
- [ ] Email briefing delivery (Resend)
- [ ] Competitor website monitoring (change detection)
- [ ] Semantic deduplication via embeddings
- [ ] Breaking news real-time alerts (FCM push)
- [ ] PDF export of briefings
- [ ] Team accounts + Stripe billing
- [ ] 24h / 7-day market impact forecasts

---

## License

Private — all rights reserved.
