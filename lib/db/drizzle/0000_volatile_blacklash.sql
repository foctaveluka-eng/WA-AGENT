CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"model" text DEFAULT 'GPT-4o mini' NOT NULL,
	"communication_style" text DEFAULT 'amical' NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"whatsapp_connected" boolean DEFAULT false NOT NULL,
	"whatsapp_phone" text,
	"timezone" text,
	"response_delay" integer DEFAULT 20,
	"emoji_reactions" boolean DEFAULT false NOT NULL,
	"emoji_list" text,
	"language" text DEFAULT 'fr',
	"greeting_message" text,
	"fallback_message" text,
	"max_response_length" integer DEFAULT 500,
	"persona_name" text,
	"working_hours_start" text DEFAULT '00:00',
	"working_hours_end" text DEFAULT '23:59',
	"auto_handoff" boolean DEFAULT false NOT NULL,
	"handoff_message" text,
	"message_frequency_limit" integer DEFAULT 60,
	"resources" text,
	"notification_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_docs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"image_url" text,
	"link" text,
	"item_type" text DEFAULT 'product' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text DEFAULT 'WhatsApp' NOT NULL,
	"agent_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer,
	"jid" text,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"mode" text DEFAULT 'automatic' NOT NULL,
	"agent_name" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"conversation_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_name" text NOT NULL,
	"lead_phone" text NOT NULL,
	"product_name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"welcome_text" text NOT NULL,
	"button_color" text DEFAULT '#25D366' NOT NULL,
	"button_text" text,
	"position" text DEFAULT 'bottom-right' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"embed_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key_preview" text NOT NULL,
	"full_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'Free' NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"custom_domain" text
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"plan" text DEFAULT 'Free' NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"credits_total" integer DEFAULT 100 NOT NULL,
	"active_agents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'Autre' NOT NULL,
	"shortcut" text,
	"agent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blacklist_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"events" text DEFAULT '[]' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"secret" text NOT NULL,
	"last_status" text DEFAULT 'pending',
	"last_pinged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" text,
	"frequency" text DEFAULT 'instant' NOT NULL,
	"new_lead" boolean DEFAULT true NOT NULL,
	"new_conversation" boolean DEFAULT true NOT NULL,
	"agent_error" boolean DEFAULT true NOT NULL,
	"order_placed" boolean DEFAULT false NOT NULL,
	"weekly_report" boolean DEFAULT true NOT NULL,
	"daily_digest" boolean DEFAULT false NOT NULL,
	"handoff_request" boolean DEFAULT true NOT NULL,
	"low_credits" boolean DEFAULT true NOT NULL,
	"whatsapp_disconnected" boolean DEFAULT true NOT NULL,
	"new_order" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_products" (
	"agent_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	CONSTRAINT "agent_products_agent_id_product_id_pk" PRIMARY KEY("agent_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;