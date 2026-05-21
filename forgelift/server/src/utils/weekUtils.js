export const getCurrentWeekRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setMilliseconds(end.getMilliseconds() - 1);

  return { weekStart: start, weekEnd: end };
};

export const isDateInRange = (date, start, end) => {
  const value = new Date(date).getTime();
  return value >= new Date(start).getTime() && value <= new Date(end).getTime();
};
