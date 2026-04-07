import "server-only";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { app: "story-arena" },
  // pino's default is fast JSON; Vercel ingests it natively.
});
