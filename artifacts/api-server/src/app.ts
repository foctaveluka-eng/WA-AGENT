import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import authRouter from "./routes/auth";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// Render (and most cloud providers) terminate TLS at the edge proxy.
// Trust the first proxy hop so req.secure works and secure cookies are set correctly.
if (process.env["NODE_ENV"] === "production") {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      conString: process.env["NODE_ENV"] !== "production"
        ? (process.env["DATABASE_URL"] || process.env["SUPABASE_DATABASE_URL"])
        : (process.env["SUPABASE_DATABASE_URL"] || process.env["DATABASE_URL"]),
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env["SESSION_SECRET"] || "fallback-secret",
    name: "wa.sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
    },
  }),
);

// Auth routes — public
app.use("/api/auth", authRouter);

// Protect all other /api routes
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  const sess = req.session as { userId?: number };
  if (!sess.userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  return next();
});

app.use("/api", router);

// Serve built frontend in production / deployment
const FRONTEND_DIST = path.resolve(__dirname, "../../whatsapp-agent/dist/public");
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("/{*path}", (_req: Request, res: Response) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

export default app;
