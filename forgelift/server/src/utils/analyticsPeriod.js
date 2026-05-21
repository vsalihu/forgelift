export const getAnalyticsPeriod = (period = "month") => {
  const now = new Date();

  if (period === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return { periodStart: start, periodEnd: end, periodType: "weekly" };
  }

  if (period === "all") {
    return { periodStart: new Date(0), periodEnd: now, periodType: "monthly" };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { periodStart: start, periodEnd: end, periodType: "monthly" };
};

export const getMonthRange = (month, year) => {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!numericMonth || !numericYear || numericMonth < 1 || numericMonth > 12 || numericYear < 2000) {
    const error = new Error("Please provide a valid month and year.");
    error.statusCode = 400;
    throw error;
  }

  return {
    periodStart: new Date(numericYear, numericMonth - 1, 1),
    periodEnd: new Date(numericYear, numericMonth, 0, 23, 59, 59, 999)
  };
};
