import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { notFound } from "../src/middleware/error.js";

test("health endpoint is registered under the frontend /api prefix", () => {
  const healthLayer = app.router.stack.find((layer) => layer.route?.path === "/api/health");
  assert.ok(healthLayer);
  assert.equal(healthLayer.route.methods.get, true);
});

test("unknown API route returns a JSON 404 payload", () => {
  let statusCode;
  let payload;
  const response = {
    status(value) { statusCode = value; return this; },
    json(value) { payload = value; return this; },
  };
  notFound({ method: "GET", originalUrl: "/api/not-real" }, response);
  assert.equal(statusCode, 404);
  assert.match(payload.message, /Route not found: GET \/api\/not-real/);
});
