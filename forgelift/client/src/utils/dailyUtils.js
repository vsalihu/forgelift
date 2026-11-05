// Client helpers for the daily plan. The server builds the plan; these mirror its totals and
// to-do rules so taps update instantly before the server confirms.

export const WHEY_PROTEIN_PER_SCOOP = 24;
const ML_PER_OZ = 29.5735;

export const localDayKey = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const formatDayLong = (day) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

// Water in the user's own units. Imperial: fluid ounces, one glass is 8 oz.
export const waterUnits = (imperial) =>
  imperial
    ? { unit: "oz", glassMl: 8 * ML_PER_OZ, glassLabel: "8 oz", format: (ml) => `${Math.round(ml / ML_PER_OZ)} oz` }
    : {
        unit: "L",
        glassMl: 250,
        glassLabel: "250 ml",
        format: (ml) => `${(Math.round(ml / 50) * 50 / 1000).toLocaleString("en-US", { maximumFractionDigits: 2 })} L`
      };

export const toDisplayWater = (ml, imperial) => (imperial ? Math.round(ml / ML_PER_OZ) : Math.round(ml));
export const fromDisplayWater = (value, imperial) => (imperial ? Math.round(Number(value) * ML_PER_OZ) : Math.round(Number(value)));

export const formatHours = (hours, { compact = false } = {}) => {
  if (hours === null || hours === undefined) return "";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (compact) return minutes ? `${whole}h ${minutes}m` : `${whole}h`;
  return minutes ? `${whole} h ${minutes} min` : `${whole} h`;
};

export const intakeTotals = (log = {}) => {
  const manual = log?.intake || {};
  const meals = (log?.meals || []).filter((meal) => meal?.done);
  const whey = Number(log?.supplements?.whey) || 0;
  const sum = (key) => meals.reduce((total, meal) => total + (Number(meal[key]) || 0), 0);
  return {
    protein: Math.max(0, (Number(manual.protein) || 0) + sum("protein") + whey * WHEY_PROTEIN_PER_SCOOP),
    carbs: Math.max(0, (Number(manual.carbs) || 0) + sum("carbs")),
    fat: Math.max(0, (Number(manual.fat) || 0) + sum("fat")),
    waterMl: Math.max(0, Number(manual.waterMl) || 0)
  };
};

export const buildTodos = (plan, log = {}) => {
  const totals = intakeTotals(log);
  const todos = [{ key: "checkin", kind: "checkin", label: "Morning check-in", done: Boolean(log?.checkIn?.at) }];
  if (plan.macros) {
    for (const key of ["protein", "carbs", "fat"]) {
      const target = plan.macros[key];
      todos.push({ key, kind: "macro", label: key === "protein" ? "Protein" : key === "carbs" ? "Carbs" : "Fat", unit: "g", target, value: totals[key], done: totals[key] >= target * 0.9 });
    }
  }
  todos.push({ key: "water", kind: "water", label: "Water", unit: "ml", target: plan.waterMl, value: totals.waterMl, done: totals.waterMl >= plan.waterMl * 0.95 });
  const mealsDone = (log?.meals || []).slice(0, plan.meals.count).filter((meal) => meal?.done).length;
  todos.push({ key: "meals", kind: "meals", label: `${plan.meals.count} meals`, target: plan.meals.count, value: mealsDone, done: mealsDone >= plan.meals.count });
  for (const supplement of plan.supplements) {
    const taken = Math.min(supplement.doses, Number(log?.supplements?.[supplement.key]) || 0);
    todos.push({ key: `supplement:${supplement.key}`, kind: "supplement", label: supplement.label, target: supplement.doses, value: taken, done: taken >= supplement.doses });
  }
  for (const custom of plan.customTodos || []) {
    const value = Math.max(0, Number(log?.custom?.[custom.id]) || 0);
    todos.push({ key: `custom:${custom.id}`, kind: "custom", id: custom.id, label: custom.label, type: custom.kind, target: custom.target, unit: custom.unit, icon: custom.icon, color: custom.color, value, done: value >= custom.target });
  }
  return { todos, totals, completion: { done: todos.filter((todo) => todo.done).length, total: todos.length } };
};

// Applies a PATCH body to a copy of the day's data the way the server will, for instant feedback.
export const previewUpdate = (data, body) => {
  if (!data?.plan) return data;
  const log = structuredClone(data.log || { intake: {}, meals: [], supplements: {}, checkIn: {} });
  log.intake = log.intake || {};
  log.supplements = log.supplements || {};
  if (body.supplements) Object.assign(log.supplements, body.supplements);
  if (body.custom) log.custom = { ...(log.custom || {}), ...body.custom };
  if (Array.isArray(body.meals)) {
    log.meals = body.meals.map((done, index) => {
      if (!done) return { done: false, protein: 0, carbs: 0, fat: 0 };
      const previous = log.meals?.[index];
      return previous?.done ? previous : { done: true, protein: data.plan.meals.protein, carbs: data.plan.meals.carbs, fat: data.plan.meals.fat };
    });
  }
  if (body.intake) {
    const meals = (log.meals || []).filter((meal) => meal?.done);
    const fromMeals = (key) => meals.reduce((total, meal) => total + (Number(meal[key]) || 0), 0);
    const fromWhey = (Number(log.supplements.whey) || 0) * WHEY_PROTEIN_PER_SCOOP;
    for (const [key, total] of Object.entries(body.intake)) {
      const derived = key === "waterMl" ? 0 : fromMeals(key) + (key === "protein" ? fromWhey : 0);
      log.intake[key] = Math.round(Number(total) - derived);
    }
  }
  const { todos, totals, completion } = buildTodos(data.plan, log);
  const week = (data.week || []).map((entry) => (entry.day === data.day ? { ...entry, ...completion } : entry));
  return { ...data, log, todos, totals, completion, week };
};
