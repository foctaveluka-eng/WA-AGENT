---
name: Port 5000 startup conflict
description: Why the server fails to bind port 5000 on restart and the correct fix.
---

## The problem
On workflow restart, the previous Node process keeps holding port 5000 for a few seconds. `fuser -k 5000/tcp` inside the workflow script cannot reliably kill it (cgroup isolation, timing races). The gap between fuser-kill and node-listen is enough for the port to be reclaimed.

## The fix
Make `index.ts` retry binding instead of crashing. The retry loop (up to 10 × 2 s = 20 s) gives the OS time to release the port naturally.

**Why:** `fuser` in a Replit workflow runs in a restricted cgroup and may not see/kill processes from a previous workflow run. Retrying inside the process itself is cgroup-independent.

**How to apply:** In `artifacts/api-server/src/index.ts`, wrap `app.listen()` in an async retry loop that catches `EADDRINUSE` and waits 2 s before retrying, up to `maxRetries` times.
