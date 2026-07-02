---
name: WA Session Persistence
description: How Baileys WhatsApp auth state is stored — PostgreSQL instead of filesystem — for Render compatibility.
---

## Rule
Store Baileys auth state in the `whatsapp_sessions` PostgreSQL table, **not** in `/tmp/wa-sessions` filesystem.

## Why
Render (and most cloud platforms) use ephemeral filesystems — `/tmp` is wiped on every restart/deploy. Sessions in `/tmp` are lost, forcing the user to re-pair after every deploy.

## How to apply
- `useDbAuthState(agentId, initAuthCreds, BufferJSON, proto)` in `whatsapp.ts` replaces `useMultiFileAuthState`.
- **BufferJSON must come from the Baileys dynamic import** (`BufferJSON.replacer/reviver`) — plain `JSON.stringify` corrupts binary key material (Uint8Array/Buffer) making sessions unrestorable.
- **proto.Message.AppStateSyncKeyData.fromObject** must be applied to `app-state-sync-key` values in `keys.get()` — otherwise app-state sync fails after auth.
- Table schema: `(agent_id, key_name)` composite PK, `key_data TEXT`, `updated_at TIMESTAMP`.
- All `CREATE TABLE IF NOT EXISTS` DDL lives in `artifacts/api-server/src/lib/migrate.ts` (runs on every server start).
