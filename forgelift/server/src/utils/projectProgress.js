const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// Share of last week's gain still expected next week. Gains shrink as a lifter
// gets closer to their potential, and they shrink faster for experienced lifters.
const WEEKLY_GAIN_DECAY = { Beginner: 0.97, Intermediate: 0.94, Advanced: 0.9 };

export const getGainDecay = (trainingExperience) => WEEKLY_GAIN_DECAY[trainingExperience] ?? WEEKLY_GAIN_DECAY.Intermediate;

const roundOne = (value) => Math.round(value * 10) / 10;

// Least-squares line through the recent points, expressed as "value now" and
// "gain per week", plus how far real sessions scatter around that line.
export const fitTrend = (points, { now, lookbackWeeks = 8, minPoints = 4, minSpanDays = 21 } = {}) => {
  const nowMs = new Date(now).getTime();
  const recent = points.filter((point) => new Date(point.date).getTime() >= nowMs - lookbackWeeks * WEEK_MS);
  if (recent.length < minPoints) return null;

  const firstMs = new Date(recent[0].date).getTime();
  const lastMs = new Date(recent[recent.length - 1].date).getTime();
  if ((lastMs - firstMs) / DAY_MS < minSpanDays) return null;

  const xs = recent.map((point) => (new Date(point.date).getTime() - nowMs) / WEEK_MS);
  const ys = recent.map((point) => point.value);
  const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  const varianceX = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  if (!varianceX) return null;

  const weeklyGain = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index] - meanY), 0) / varianceX;
  const current = meanY - weeklyGain * meanX;
  const residualSquares = xs.reduce((sum, x, index) => sum + (ys[index] - (current + weeklyGain * x)) ** 2, 0);
  const scatter = Math.sqrt(residualSquares / Math.max(1, xs.length - 2));

  return { current, weeklyGain, scatter, sampleSize: recent.length };
};

export const expectedAfterWeeks = (trend, decay, weeks) =>
  trend.current + (trend.weeklyGain * (1 - decay ** weeks)) / (1 - decay);

// Weekly projected points with a likely range that widens the further out it goes.
export const buildProjection = (trend, { decay, now, weeks = 12 }) => {
  const nowMs = new Date(now).getTime();
  const baseSpread = Math.max(trend.scatter, Math.abs(trend.current) * 0.01);

  return Array.from({ length: weeks + 1 }, (_, week) => {
    const expected = expectedAfterWeeks(trend, decay, week);
    const spread = baseSpread * Math.sqrt(1 + week / 2);
    return {
      date: new Date(nowMs + week * WEEK_MS).toISOString(),
      expected: roundOne(expected),
      low: roundOne(Math.max(0, expected - spread)),
      high: roundOne(expected + spread)
    };
  });
};

// When the projection first reaches `target`. With slowing gains the projection
// levels off at a ceiling, so some targets are not reachable at the current pace.
export const estimateEta = (trend, { decay, target, now, best = 0, maxWeeks = 104 }) => {
  if (best >= target) return { status: "reached" };
  if (!trend) return { status: "not_enough_data" };

  const ceiling = trend.current + trend.weeklyGain / (1 - decay);
  if (trend.current >= target) return { status: "on_pace", weeks: 0, date: new Date(now).toISOString() };
  if (trend.weeklyGain <= 0 || ceiling < target) {
    return { status: "not_on_pace", ceiling: roundOne(Math.max(ceiling, trend.current)) };
  }

  const remainingShare = 1 - ((target - trend.current) * (1 - decay)) / trend.weeklyGain;
  const weeks = Math.max(1, Math.ceil(Math.log(remainingShare) / Math.log(decay)));
  if (weeks > maxWeeks) return { status: "not_on_pace", ceiling: roundOne(ceiling) };

  return { status: "on_pace", weeks, date: new Date(new Date(now).getTime() + weeks * WEEK_MS).toISOString() };
};
