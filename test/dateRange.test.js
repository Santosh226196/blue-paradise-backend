import test from "node:test";
import assert from "node:assert/strict";
import { getDateRange, dayBounds } from "../src/utils/dateRange.js";

test("custom date range includes complete boundary days", () => {
  const range = getDateRange({ period: "custom", from: "2026-08-01", to: "2026-08-10" });
  assert.equal(range.$gte.getHours(), 0);
  assert.equal(range.$lte.getHours(), 23);
  assert.equal(range.$lte.getMinutes(), 59);
});

test("dayBounds returns one calendar day", () => {
  const range = dayBounds(new Date(2026, 7, 26, 12));
  assert.equal(range.$gte.getDate(), 26);
  assert.equal(range.$gte.getHours(), 0);
  assert.equal(range.$lte.getDate(), 26);
  assert.equal(range.$lte.getHours(), 23);
});
