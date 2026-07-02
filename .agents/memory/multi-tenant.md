---
name: Multi-tenant isolation
description: How user data isolation is implemented across all tables and routes.
---

## Rule
Every top-level resource table has a nullable `user_id integer` column. All route handlers filter SELECT/INSERT/UPDATE/DELETE by `req.session.userId`. WhatsApp-created records (orders) carry the agent's `userId`.

## Tables with user_id
agents, products, leads, orders, templates, webhooks, widgets, blacklist, profile, organization, org_members, api_keys

## Conversations
Isolated via `agentId`: conversations.agentId → agents.userId. Routes build a list of the user's agentIds and use `inArray(conversationsTable.agentId, agentIds)`.

## Migration pattern
`migrate.ts` uses `ALTER TABLE "X" ADD COLUMN IF NOT EXISTS "user_id" integer;` — safe to re-run on existing databases.

## WhatsApp service
When the AI creates orders automatically (whatsapp.ts), the order is stored with `userId: agent.userId` so it appears in the owner's orders list.

## Blacklist note
The original DB has a UNIQUE constraint on `blacklist.phone` (not dropped by migration). Two users cannot blacklist the same phone number — acceptable trade-off for now.

**Why:** Without user_id, all accounts shared the same agents/products/leads/orders — classic multi-tenant isolation gap.

**How to apply:** Always set userId on INSERT and filter by eq(table.userId, userId) on SELECT. Use the `uid(req)` helper pattern defined in each route file.
