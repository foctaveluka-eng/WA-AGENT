import { pool } from "@workspace/db";
import { logger } from "./logger";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" text NOT NULL DEFAULT 'user',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "agents" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "model" text NOT NULL DEFAULT 'GPT-4o mini',
  "communication_style" text NOT NULL DEFAULT 'amical',
  "prompt" text NOT NULL DEFAULT '',
  "is_active" boolean NOT NULL DEFAULT true,
  "whatsapp_connected" boolean NOT NULL DEFAULT false,
  "whatsapp_phone" text,
  "timezone" text,
  "response_delay" integer DEFAULT 20,
  "emoji_reactions" boolean NOT NULL DEFAULT false,
  "emoji_list" text,
  "language" text DEFAULT 'fr',
  "greeting_message" text,
  "fallback_message" text,
  "max_response_length" integer DEFAULT 500,
  "persona_name" text,
  "working_hours_start" text DEFAULT '00:00',
  "working_hours_end" text DEFAULT '23:59',
  "auto_handoff" boolean NOT NULL DEFAULT false,
  "handoff_message" text,
  "message_frequency_limit" integer DEFAULT 60,
  "resources" text,
  "notification_phone" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" serial PRIMARY KEY,
  "agent_id" integer,
  "jid" text,
  "contact_name" text NOT NULL,
  "contact_phone" text NOT NULL,
  "mode" text NOT NULL DEFAULT 'automatic',
  "agent_name" text,
  "message_count" integer NOT NULL DEFAULT 0,
  "last_message" text,
  "last_message_at" timestamp,
  "conversation_summary" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "conversation_id" integer NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "knowledge_docs" (
  "id" serial PRIMARY KEY,
  "agent_id" integer NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "size" integer NOT NULL,
  "content" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "image_url" text,
  "link" text,
  "item_type" text NOT NULL DEFAULT 'product',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "leads" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text,
  "status" text NOT NULL DEFAULT 'new',
  "source" text NOT NULL DEFAULT 'WhatsApp',
  "agent_name" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY,
  "lead_name" text NOT NULL,
  "lead_phone" text NOT NULL,
  "product_name" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "appointments" (
  "id" serial PRIMARY KEY,
  "agent_id" integer NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
  "client_name" text NOT NULL,
  "client_phone" text,
  "date" text NOT NULL,
  "time" text NOT NULL,
  "notes" text,
  "status" text NOT NULL DEFAULT 'confirmed',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "blacklist" (
  "id" serial PRIMARY KEY,
  "phone" text NOT NULL UNIQUE,
  "reason" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" serial PRIMARY KEY,
  "url" text NOT NULL,
  "events" text NOT NULL DEFAULT '[]',
  "active" boolean NOT NULL DEFAULT true,
  "secret" text NOT NULL,
  "last_status" text DEFAULT 'pending',
  "last_pinged_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notification_settings" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "email" text,
  "frequency" text NOT NULL DEFAULT 'instant',
  "new_lead" boolean NOT NULL DEFAULT true,
  "new_conversation" boolean NOT NULL DEFAULT true,
  "agent_error" boolean NOT NULL DEFAULT true,
  "order_placed" boolean NOT NULL DEFAULT false,
  "weekly_report" boolean NOT NULL DEFAULT true,
  "daily_digest" boolean NOT NULL DEFAULT false,
  "handoff_request" boolean NOT NULL DEFAULT true,
  "low_credits" boolean NOT NULL DEFAULT true,
  "whatsapp_disconnected" boolean NOT NULL DEFAULT true,
  "new_order" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "templates" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "category" text NOT NULL DEFAULT 'Autre',
  "shortcut" text,
  "agent_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "widgets" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "phone_number" text NOT NULL,
  "welcome_text" text NOT NULL,
  "button_color" text NOT NULL DEFAULT '#25D366',
  "button_text" text,
  "position" text NOT NULL DEFAULT 'bottom-right',
  "is_active" boolean NOT NULL DEFAULT true,
  "embed_code" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "profile" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "plan" text NOT NULL DEFAULT 'Free',
  "credits_used" integer NOT NULL DEFAULT 0,
  "credits_total" integer NOT NULL DEFAULT 100,
  "active_agents" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "organization" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "plan" text NOT NULL DEFAULT 'Free',
  "member_count" integer NOT NULL DEFAULT 1,
  "custom_domain" text
);

CREATE TABLE IF NOT EXISTS "org_members" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  "joined_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "key_preview" text NOT NULL,
  "full_key" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "agent_products" (
  "agent_id" integer NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  PRIMARY KEY ("agent_id", "product_id")
);

CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
  "agent_id"   integer NOT NULL,
  "key_name"   text NOT NULL,
  "key_data"   text NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("agent_id", "key_name")
);

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "webhooks" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "widgets" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "blacklist" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "org_members" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "user_id" integer;
`;

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA_SQL);
    logger.info("Migrations appliquées avec succès");
  } catch (err) {
    logger.error({ err }, "Erreur lors des migrations — démarrage quand même");
  } finally {
    client.release();
  }
}
