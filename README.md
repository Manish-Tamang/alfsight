<p align="center">
  <img src=".github/assets/alfsight.png" alt="Alfsight logo" width="96" height="96" />
</p>

<h1 align="center">Alfsight</h1>

<p align="center">
  <strong>The open-source alternative to Elfsight.</strong><br />
  Self-hosted Instagram feed widgets for any website.
</p>

<p align="center">
  <a href="#getting-started">Getting started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="https://github.com/Manish-Tamang/alfsight">GitHub</a>
</p>

<p align="center">
  <a href="https://github.com/Manish-Tamang/alfsight/actions/workflows/deploy.yml"><img src="https://github.com/Manish-Tamang/alfsight/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-19ca58" alt="MIT License" /></a>
  <a href="https://github.com/Manish-Tamang/alfsight/stargazers"><img src="https://img.shields.io/github/stars/Manish-Tamang/alfsight?style=flat&color=19ca58" alt="GitHub stars" /></a>
  <a href="https://github.com/Manish-Tamang/alfsight/commits/main"><img src="https://img.shields.io/github/last-commit/Manish-Tamang/alfsight?color=19ca58" alt="Last commit" /></a>
  <img src="https://img.shields.io/badge/widget-%3C%206%20kB%20gzipped-19ca58" alt="Widget under 6 kB gzipped" />
  <a href="https://github.com/Manish-Tamang/alfsight/pulls"><img src="https://img.shields.io/badge/PRs-welcome-19ca58" alt="PRs welcome" /></a>
</p>

<p align="center">
  <a href="https://workers.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflareworkers&logoColor=white" alt="Cloudflare Workers" /></a>
  <a href="https://pages.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?logo=cloudflarepages&logoColor=white" alt="Cloudflare Pages" /></a>
  <a href="https://developers.cloudflare.com/d1/"><img src="https://img.shields.io/badge/Cloudflare_D1-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare D1" /></a>
  <a href="https://developers.cloudflare.com/kv/"><img src="https://img.shields.io/badge/Cloudflare_KV-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare KV" /></a>
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hono.dev/"><img src="https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white" alt="Hono" /></a>
  <a href="https://orm.drizzle.team/"><img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white" alt="Zod" /></a>
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white" alt="Astro" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB" alt="React 19" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
</p>

A lightweight, embeddable Instagram feed widget service and management dashboard. Fetch public Instagram data server-side, cache feed content at the edge, and embed customizable grids on any website using a zero-dependency Web Component `<script>` tag.

---

## Tech Stack

### Core Technologies
- **Monorepo**: [pnpm Workspaces](https://pnpm.io/)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (Edge V8)
- **Language**: TypeScript

### Applications & Packages
- **API (`apps/api`)**: [Hono](https://hono.dev/) v4, [Drizzle ORM](https://orm.drizzle.team/), [Zod](https://zod.dev/)
- **Dashboard (`apps/dashboard`)**: [React 19](https://react.dev/), [Vite 6](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [React Router v7](https://reactrouter.com/), [Lucide React](https://lucide.dev/) (Inter & Satoshi typography)
- **Widget (`apps/widget`)**: Vanilla Web Component (`customElements` + Shadow DOM), zero framework runtime (< 6 kB gzipped)
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

Everything deploys to Cloudflare from the repo root. The API is a Worker; the widget, dashboard and website are Pages projects.

```bash
# 1. One-time setup
pnpm wrangler login
pnpm wrangler d1 create instagram-widget-db        # paste database_id into apps/api/wrangler.jsonc
pnpm wrangler kv namespace create FEED_CACHE       # paste id into apps/api/wrangler.jsonc
pnpm db:migrate:remote

# 2. Secrets
pnpm wrangler secret put ADMIN_TOKEN --config apps/api/wrangler.jsonc          # dashboard sign-in
pnpm wrangler secret put OPENHANDLE_LIVE_KEY --config apps/api/wrangler.jsonc

# 3. Deploy
pnpm deploy:api
pnpm deploy:widget
pnpm deploy:dashboard   # needs apps/dashboard/.env.production (see .env.example)
pnpm deploy:web         # needs apps/web/.env.production (see .env.example)
```

### Auto deploy

`.github/workflows/deploy.yml` deploys on every push to `main`, but only the apps whose files changed (D1 migrations run before the API deploys). Run it manually from the Actions tab to deploy everything.

Add these in GitHub → Settings → Secrets and variables → Actions:

| Name | Type | Value |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | API token with **Workers Scripts: Edit**, **Cloudflare Pages: Edit** and **D1: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Your Cloudflare account ID |
| `PUBLIC_API_BASE` | Variable | e.g. `https://api.example.com` |
| `PUBLIC_WIDGET_URL` | Variable | e.g. `https://alfsight-widget.pages.dev` |
| `PUBLIC_DASHBOARD_URL` | Variable | e.g. `https://alfsight-dashboard.pages.dev` |

Embed a widget on any site:

```html
<script src="https://alfsight-widget.pages.dev/instagram.iife.js" defer></script>
<instagram-feed feed="YOUR_FEED_ID" api-base="https://instagram-widget-api.<you>.workers.dev"></instagram-feed>
```

---

## License

[MIT](LICENSE) © Manish Tamang
