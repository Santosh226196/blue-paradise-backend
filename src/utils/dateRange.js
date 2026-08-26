const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export function getDateRange({ period, from, to } = {}) {
  const now = new Date();
  if (from || to || period === "custom") {
    return {
      ...(from && { $gte: startOfDay(from) }),
      ...(to && { $lte: endOfDay(to) }),
    };
  }

  const start = startOfDay(now);
  if (period === "today" || period === "hourly") return { $gte: start, $lte: endOfDay(now) };
  if (period === "week" || period === "daily") start.setDate(start.getDate() - 6);
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
