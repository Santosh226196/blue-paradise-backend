function parseDate(date, field) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) return new Date(date);
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw Object.assign(new Error(`${field} must use YYYY-MM-DD format`), { statusCode: 400 });
  }
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day) {
    throw Object.assign(new Error(`${field} is not a valid calendar date`), { statusCode: 400 });
  }
  return value;
}

const startOfDay = (date, field = "date") => {
  const value = parseDate(date, field);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date, field = "date") => {
  const value = parseDate(date, field);
  value.setHours(23, 59, 59, 999);
  return value;
};

export function getDateRange({ period, from, to } = {}) {
  const now = new Date();
  if (from || to || period === "custom") {
    if (!from && !to) throw Object.assign(new Error("A custom report requires from or to"), { statusCode: 400 });
    const range = { ...(from && { $gte: startOfDay(from, "from") }), ...(to && { $lte: endOfDay(to, "to") }) };
    if (range.$gte && range.$lte && range.$gte > range.$lte) {
      throw Object.assign(new Error("from must be on or before to"), { statusCode: 400 });
    }
    return range;
  }

  const allowed = new Set([undefined, "all", "today", "hourly", "week", "daily", "month", "monthly", "year", "yearly"]);
  if (!allowed.has(period)) throw Object.assign(new Error("Unsupported report period"), { statusCode: 400 });

  if (period === "all") return {};

  const start = startOfDay(now);
  if (period === "today" || period === "hourly") return { $gte: start, $lte: endOfDay(now) };
  if (period === "week" || period === "daily") start.setDate(start.getDate() - 6);
  else if (period === "month") start.setDate(1);
  else if (period === "monthly") {
    start.setDate(1);
    start.setMonth(start.getMonth() - 11);
  } else if (period === "yearly") {
    start.setMonth(0, 1);
    start.setFullYear(start.getFullYear() - 4);
  } else if (period === "year") start.setFullYear(start.getFullYear() - 1);
  else start.setMonth(start.getMonth() - 1);
  return { $gte: start, $lte: endOfDay(now) };
}

export function dayBounds(value = new Date()) {
  return { $gte: startOfDay(value), $lte: endOfDay(value) };
}
