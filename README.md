# Switchyard

A diagram studio that runs in the browser: flowcharts, nested process phases, circuit schematics and chemical structure diagrams, with guided step-by-step builds and PNG, SVG and JSON export.

This repository hosts Switchyard on **Cloudflare Pages**. Signing in is handled by **Cloudflare Access**, and each person's diagrams are stored privately in a **Cloudflare D1** database, so they follow you across devices.

The same page also runs as a claude.ai artifact. There it stores diagrams in your Claude account instead.

## How it fits together

| Piece | What it does |
| --- | --- |
| `index.html` | The whole app: one HTML file of markup, CSS and JavaScript. It's the same file that is published to claude.ai. |
| `scripts/build.mjs` | Wraps `index.html` in a full HTML document and writes `public/`. |
| `static/` | Copied into `public/`: the favicon and `_headers` (security headers, including a Content Security Policy). |
| `functions/api/` | Pages Functions: the storage API (`/api/me`, `/api/diagrams`, `/api/diagrams/:id`). |
| `migrations/` | The D1 schema. |
| `wrangler.toml` | Project config: the D1 binding and the two Access settings. |

The page picks its storage when it loads:

1. **Inside claude.ai:** your Claude account.
2. **On your own domain, signed in through Access:** the D1 database, through `/api`.
3. **Otherwise** (for example a static host such as GitHub Pages, or nobody is signed in): this browser only. The page still works fully, and you can move diagrams between devices with Export and Import.

## Deploy to Cloudflare Pages (about 15 minutes)

You need a Cloudflare account and this repository on GitHub.

### 1. Create the database

```bash
npm install
```

```bash
npx wrangler login
```

```bash
npx wrangler d1 create switchyard
```

Copy the `database_id` it prints into `wrangler.toml`. The deploy fails until this is a real ID.

The storage API creates its table the first time it's used. If you'd rather create it up front:

```bash
npm run db:migrate
```

### 2. Create the Pages project

In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repository. Use these settings:

- **Framework preset:** None
- **Build command:** `node scripts/build.mjs`
- **Build output directory:** `public`

Deploy. Your site is now live at `https://<project>.pages.dev`. It already works, with diagrams saved in each visitor's browser.

### 3. Turn on sign-in and synced storage

1. Open **Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Set the application domain to `<project>.pages.dev`. Add your custom domain too, if you use one.
3. Add a policy that allows the people who should have access. For example, *Emails* set to your address, or *Emails ending in* `@yourcompany.com`.
4. Save the application, then open it and copy its **Application Audience (AUD) tag**.
5. Your **team domain** is shown under **Zero Trust → Settings → Custom pages**. It looks like `yourteam.cloudflareaccess.com`.
6. Put both values in `wrangler.toml` (`ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`), commit, and push. Pages redeploys on its own.

Also turn on **Settings → General → Access policy** for preview deployments in your Pages project, so preview URLs are protected as well.

Visit the site, sign in with the one-time code Access emails you, and the indicator next to the diagram name reads **Synced**.

### Why Access and not a password

The storage API trusts nobody by default. Every `/api` request must carry a valid, unexpired Access token signed for your application. The function checks it against Cloudflare's published keys (`functions/api/_auth.js`) and then uses the signed-in email to scope every database query. If Access isn't set up, the API answers *Not signed in* and the app falls back to browser storage. It never shows one person's diagrams to another.

## Develop locally

```bash
npm install
```

```bash
cp .dev.vars.example .dev.vars
```

```bash
npm run db:migrate:local
```

```bash
npm run dev
```

Open http://localhost:8788. Locally, `.dev.vars` pretends you are signed in as `DEV_USER`. **Never set `DEV_USER` in production.** It switches off the sign-in check.

## Static hosting only (GitHub Pages)

If you don't need sync, any static host works:

```bash
node scripts/build.mjs
```

Then publish the `public/` folder. With no `/api` behind it, Switchyard keeps diagrams in each visitor's browser, and Export offers real file downloads.

## Limits

- Up to 1,000 diagrams per person, each up to about 1.8 MB (embedded images take most of that).
- Free Cloudflare plans include Access for up to 50 users and a D1 allowance that covers personal and small-team use.

Created by Joshua Omolade.
