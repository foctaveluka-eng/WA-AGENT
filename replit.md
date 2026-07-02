# WA Agent — Plateforme d'agents WhatsApp IA

Plateforme multi-agents WhatsApp alimentée par l'IA : connectez un numéro WhatsApp, définissez un prompt, et l'agent répond automatiquement à vos clients. Intervención humaine avec bascule en temps réel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/whatsapp-agent run dev` — Frontend (port 5000, set via `PORT` env var)
- `pnpm run typecheck` — typecheck complet
- `pnpm run build` — typecheck + build tous les packages
- `pnpm --filter @workspace/api-spec run codegen` — régénérer les hooks API et schémas Zod
- `pnpm --filter @workspace/db run push` — pousser les changements de schéma DB (dev seulement)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080)
- Frontend: React 19 + Vite (port 5173) + Tailwind CSS v4 + Shadcn UI
- DB: PostgreSQL + Drizzle ORM
- WhatsApp: @whiskeysockets/baileys (direct WA Web protocol)
- AI: API externe `https://delfaapiai.vercel.app/ai/copilot`
- Auth: Session cookie (express-session + connect-pg-simple)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (depuis OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — schémas Drizzle (source de vérité DB)
- `lib/api-spec/openapi.yaml` — contrat API OpenAPI (source de vérité API)
- `lib/api-zod/` — schémas Zod générés depuis l'OpenAPI spec
- `lib/api-client-react/` — hooks React Query générés
- `artifacts/api-server/src/services/whatsapp.ts` — moteur Baileys + handler messages + appel IA
- `artifacts/api-server/src/routes/` — routes Express
- `artifacts/whatsapp-agent/src/pages/` — pages React

## Architecture decisions

- Chaque agent a sa propre session Baileys stockée dans `/tmp/wa-sessions/agent-{id}`
- Les conversations sont liées à un agent via `agentId` et identifiées par `jid` (JID WhatsApp)
- L'IA est appelée uniquement si `conversation.mode === 'automatic'`
- L'intervention humaine bascule `mode` en `'manual'` ; le bouton "Réactiver l'IA" repasse en `'automatic'`
- `autoHandoff` sur l'agent : si activé, envoyer depuis le dashboard bascule automatiquement en mode manuel
- L'API IA reçoit le contexte complet : prompt système + historique des 10 derniers messages

## Product

- Dashboard avec stats en temps réel
- Gestion d'agents IA WhatsApp multi-numéros
- Connexion via QR code Baileys
- Réponse automatique IA dès connexion
- Takeover humain par conversation avec bascule temps réel
- Base de connaissances par agent
- Gestion leads, commandes, produits, widgets, templates
- Liste noire, webhooks, notifications

## User preferences

- Interface en français
- Démarrer l'app directement (les deux workflows tournent en parallèle)

## Gotchas

- Toujours pousser le schéma DB après modification : `pnpm --filter @workspace/db run push`
- Les sessions Baileys sont dans `/tmp/` — elles sont perdues au redémarrage du conteneur (normal)
- L'API IA externe peut être lente (timeout 15s)
- Ne pas exposer de secrets via `VITE_*` (envoyés au navigateur)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
