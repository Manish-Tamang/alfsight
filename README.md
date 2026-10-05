# Alfsight

A lightweight, embeddable Instagram feed widget service and management dashboard. Fetch public Instagram data server-side, cache feed content at the edge, and embed customizable grids on any website using a zero-dependency Web Component `<script>` tag.

---

## Tech Stack

### Core Technologies
- **Monorepo**: [pnpm Workspaces](https://pnpm.io/)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (Edge V8)
- **Language**: TypeScript

### Applications & Packages
- **API (`apps/api`)**: [Hono](https://hono.dev/) v4, [Drizzle ORM](https://orm.drizzle.team/), [Zod](https://zod.dev/)
- **Dashboard (`apps/dashboard`)**: [React 19](https://react.dev/), [Vite 6](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [React Router v7](https://reactrouter.com/), [Lucide React](https://lucide.dev/) (Roboto & Rubik typography)
- **Widget (`apps/widget`)**: Vanilla Web Component (`customElements` + Shadow DOM), zero framework runtime (< 3 kB gzipped)
- **Database (`database`)**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) with Drizzle ORM migrations
- **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/) for low-latency edge feed delivery
- **Background Sync**: Cloudflare Cron Triggers (automatic scheduled feed refreshes)
- **Shared Packages (`packages/*`)**:
  - `@instagram-widget/types`: Shared TypeScript interfaces
  - `@instagram-widget/validation`: Shared Zod validation schemas

---

## Architecture

```
[ Visitor / Website ]
         │
         ▼
 ┌───────────────┐     ┌──────────────┐     ┌────────────────┐
 │ <instagram-   │────▶│ Cloudflare   │────▶│ Cloudflare KV  │ (Cache Hit)
 │  feed> Widget │     │ Workers (API)│     │ Edge Cache     │
 └───────────────┘     └──────┬───────┘     └────────────────┘
                              │ (Cache Miss)
                       ┌──────▼───────┐     ┌────────────────┐
                       │ Cloudflare   │◀────│ Scheduled Cron │
                       │ D1 Database  │     │ (Sync Feeds)   │
                       └──────────────┘     └───────┬────────┘
                                                    │
                                            ┌───────▼────────┐
                                            │ OpenHandle     │
                                            │ Instagram API  │
                                            └────────────────┘
```

---

## Project Structure

```
alfsight/
├── apps/
│   ├── api/            # Cloudflare Workers API (Hono + Drizzle)
│   ├── dashboard/      # Admin dashboard (React 19 + Vite + Tailwind v4)
│   └── widget/         # Standalone embeddable Web Component
├── packages/
│   ├── types/          # Shared TypeScript type definitions
│   └── validation/     # Shared Zod validation schemas
├── database/
│   ├── schema.ts       # Drizzle schema definitions
│   └── migrations/     # Auto-generated SQL migrations
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed via dev dependencies)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd alfsight

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Development

```bash
# Run all applications simultaneously
pnpm dev

# Or run individual targets:
pnpm dev:api         # API at http://localhost:8787
pnpm dev:dashboard   # Dashboard at http://localhost:5173
pnpm dev:widget      # Widget preview at http://localhost:5174
```

### Database & Migrations

```bash
# Generate migrations from schema
pnpm db:generate

# Apply migrations locally
pnpm --filter @instagram-widget/api exec wrangler d1 execute instagram-widget-db --local --file=../../database/migrations/0000_bouncy_peter_parker.sql
pnpm --filter @instagram-widget/api exec wrangler d1 execute instagram-widget-db --local --file=../../database/migrations/0001_old_risque.sql
```

---

## Widget Usage

Add the bundled script to any web page and insert the custom tag:

```html
<script src="https://your-domain.com/instagram.js" defer></script>

<instagram-feed
  feed="YOUR_FEED_ID"
  api-base="https://your-api.com"
></instagram-feed>
```

- Isolated styles using Shadow DOM (no CSS collision with host pages)
- Supports responsive column layouts (1–4 columns), captions, and profile header toggles
- Compatible with plain HTML, WordPress, Shopify, Webflow, React, Vue, Next.js, etc.

---

## API Reference

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Service health status |
| `GET` | `/api/feeds/:id` | No | Fetch feed metadata and posts (cached via KV) |
| `GET` | `/api/feeds` | Yes | List feeds for current account |
| `POST` | `/api/feeds` | Yes | Create a new feed configuration |
| `PATCH` | `/api/feeds/:id` | Yes | Update feed settings |
| `DELETE` | `/api/feeds/:id` | Yes | Remove a feed |
| `POST` | `/api/feeds/:id/refresh` | Yes | Trigger manual feed sync |
| `POST` | `/api/instagram/connect` | Yes | Generate OAuth authorization URL |
| `GET` | `/api/instagram/callback` | No | Meta OAuth redirect callback |
| `GET` | `/api/instagram/accounts` | Yes | List linked Instagram accounts |
| `GET` | `/api/instagram/:identifier` | No | Fetch a normalized public profile |
| `GET` | `/api/instagram/:identifier/posts` | No | Fetch one cursor-paginated posts page |
| `GET` | `/api/instagram/:identifier/reels` | No | Fetch one cursor-paginated reels page |
| `GET` | `/api/instagram/:identifier/stories` | No | Fetch current, non-expired public Stories |
| `GET` | `/api/instagram/:identifier/highlights` | No | Fetch public Highlights and story references |
| `GET` | `/api/instagram/:identifier/followers` | No | Fetch one cursor-paginated follower page |
| `GET` | `/api/instagram/:identifier/following` | No | Fetch one cursor-paginated following page |

> **Local Development Auth**: Pass the `x-dev-user-id: dev-user-1` header to simulate an authenticated request during local development.

## OpenHandle

OpenHandle is the initial public Instagram data provider. Requests go from the browser to this API, then from the API to OpenHandle; the provider key is never sent to browser code, widget configuration, responses, logs, or local storage. Use a Test key during development. Live keys may incur usage charges and belong in Cloudflare Worker secrets, not committed files. Responses are normalized by the API and cached in Cloudflare KV, with shorter freshness for Stories because they expire. This project is not affiliated with Instagram, Meta, or OpenHandle.

### Local setup

```bash
pnpm install
cp .env.example .env
# Add OPENHANDLE_TEST_KEY to apps/api/.dev.vars
pnpm dev
```

---

## Build & Deployment

```bash
# Build all apps and packages
pnpm build

# Deploy Cloudflare Worker API
pnpm --filter @instagram-widget/api exec wrangler deploy

# Build Dashboard (outputs to apps/dashboard/dist)
pnpm build:dashboard

# Build Widget bundle (outputs to apps/widget/dist)
pnpm build:widget
```
