import http from "node:http";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { ensureAdminUser } from "./controllers/auth.controller.js";

let server;
async function start() {
  await connectDatabase();
  await ensureAdminUser();
  server = http.createServer(app).listen(env.port, () => {
    console.log(`Blue Paradise API running at http://localhost:${env.port}/api`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
