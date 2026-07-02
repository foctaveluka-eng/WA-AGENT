import { defineConfig } from "drizzle-kit";
import path from "path";

const dbUrl = process.env["SUPABASE_DATABASE_URL"] || process.env["DATABASE_URL"];

if (!dbUrl) {
  throw new Error("SUPABASE_DATABASE_URL (ou DATABASE_URL) doit être défini");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
    ssl: { rejectUnauthorized: false },
  },
  tablesFilter: ["!user_sessions"],
});
