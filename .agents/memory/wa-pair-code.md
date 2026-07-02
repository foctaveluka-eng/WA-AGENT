---
name: WA Pair-Code Flow
description: Correct sequence for WhatsApp pairing-code generation, including Render deployment constraints.
---

## Rule
The `/pair` route must **always** wipe stored credentials before starting a session, and the `_initBaileys` call must use a generation counter to abort stale initializations.

## Why
- **Stale creds**: If there are any leftover credentials from a previous failed attempt, Baileys tries to reconnect with them instead of presenting a QR/pair opportunity. WhatsApp immediately rejects expired/invalid creds → socket closes → `waitForSessionReady` times out → user gets an error.
- **Race condition**: `stopSession()` kills the socket, but an in-flight `_initBaileys` could still be awaiting async DB reads. Without a generation guard, the stale init can overwrite the socket map and corrupt state after a new session started.

## How to apply
`/pair` sequence (agents.ts):
1. `await waManager.stopSession(id)` — kills socket + reconnect timer, bumps generation
2. `await waManager.clearSessionCreds(id)` — deletes all rows from `whatsapp_sessions` for this agent
3. `await waManager.startSession(id)` — fresh init with no prior creds → Baileys emits QR
4. `await waManager.waitForSessionReady(id, 40000)` — longer timeout for cloud servers
5. `await waManager.requestPairingCode(id, phone)` — exchanges QR for pairing code

Generation counter (`initGeneration` Map in WhatsAppManager):
- `_nextGen(agentId)` → increments and returns new generation number
- `_currentGen(agentId)` → returns current generation
- Called in: `stopSession()` (always), reconnect timer (gets own nextGen)
- Checked in: `_initBaileys` before writing socket, in QR/open/messages handlers

## Timeouts
- `waitForSessionReady`: 40s for pair route (cloud servers are slower)
- `connectTimeoutMs` / `qrTimeout`: 90s in Baileys socket options
