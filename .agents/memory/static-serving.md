---
name: Static frontend serving in production
description: How the API server serves the built React frontend.
---

## Setup
`artifacts/api-server/src/app.ts` checks `existsSync(FRONTEND_DIST)` at startup. If the built frontend exists, it serves static files and adds a catch-all SPA route.

`FRONTEND_DIST = path.resolve(__dirname, "../../whatsapp-agent/dist/public")`
From the built `dist/index.mjs`, `__dirname` = `artifacts/api-server/dist/`, so this resolves to `artifacts/whatsapp-agent/dist/public`.

## Express 5 gotcha
Express 5 uses path-to-regexp v8 which rejects the bare wildcard `*`. Use `"/{*path}"` instead of `"*"` for the SPA catch-all route.

**Why:** path-to-regexp v8 requires named parameters. `*` without a name throws `PathError: Missing parameter name`.

**How to apply:** `app.get("/{*path}", handler)` — always use this form in Express 5 catch-alls.
