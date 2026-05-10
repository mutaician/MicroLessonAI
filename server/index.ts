import { serveStatic } from "hono/bun";
import { app } from "./app.js";
import { env } from "./env.js";

app.use("/assets/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

Bun.serve({
  port: env.port,
  idleTimeout: 255,
  fetch: app.fetch
});

console.log(`MicroLesson AI API running on http://localhost:${env.port}`);
