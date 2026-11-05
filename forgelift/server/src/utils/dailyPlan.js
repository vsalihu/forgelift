// Daily nutrition, hydration, supplement and sleep plan. Pure: no database access, so the numbers
// can be tested directly. General guidance for healthy adults, not medical advice.

export const GOALS = ["cut", "maintain", "gain"];
export const SUPPLEMENTS = {
  creatine: { label: "Creatine", timing: "Any time, ideally with a meal" },
  whey: { label: "Whey protein", timing: "Whenever it closes your protein gap" },
  vitamin_d: { label: "Vitamin D", timing: "With a meal that has some fat" },
  omega3: { label: "Omega-3", timing: "With a meal" },
  magnesium: { label: "Magnesium", timing: "In the evening" },
  multivitamin: { label: "Multivitamin", timing: "With breakfast" },
  caffeine: { label: "Caffeine or pre-workout", timing: "30-45 min before training", trainingOnly: true },
  electrolytes: { label: "Electrolytes", timing: "During or after training", trainingOnly: true }
};
export const SUPPLEMENT_KEYS = Object.keys(SUPPLEMENTS);

export const CREATINE_LOADING_DAYS = 7;
export const WHEY_PROTEIN_PER_SCOOP = 24;
const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;
const HIT = 0.9;

const round = (value, step = 1) => Math.round(value / step) * step;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const num = (value) => (value === null || value === undefined || value === "" ? null : Number(value));
const valid = (value, min, max) => (Number.isFinite(value) && value >= min && value <= max ? value : null);

export const goalFromPath = (goalPath = "") => {
  if (/fat loss/i.test(goalPath)) return "cut";
  if (/muscle builder|glute growth/i.test(goalPath)) return "gain";
  return "maintain";
};

const daysBetween = (fromDay, toDay) => Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86400000);

const ageFrom = (user) => {
  if (user.dateOfBirth) {
    const birth = new Date(user.dateOfBirth);
    const now = new Date();
    let age = now.getUTCFullYear() - birth.getUTCFullYear();
    if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age -= 1;
    return valid(age, 14, 90);
  }
  return valid(num(user.age), 14, 90);
};

// Everything the plan needs about the person, in metric, with what's missing listed.
export const resolveInputs = ({ user = {}, profile = {}, morningWeight = null }) => {
  const imperial = user.preferredUnits === "imperial";
  const rawWeight = num(morningWeight) ?? num(user.bodyweight);
  const weightKg = valid(rawWeight === null ? NaN : imperial ? rawWeight * KG_PER_LB : rawWeight, 30, 300);
  const rawHeight = num(user.height);
  const heightCm = valid(rawHeight === null ? NaN : imperial ? rawHeight * CM_PER_IN : rawHeight, 120, 230);
  const age = ageFrom(user);
  const sex = ["male", "female"].includes(profile.sex) ? profile.sex : ["male", "female"].includes(user.gender) ? user.gender : "";
  const goal = GOALS.includes(profile.goal) ? profile.goal : goalFromPath(user.goalPath);
  const trainingDaysPerWeek = clamp(Math.round(num(profile.trainingDaysPerWeek) ?? 3), 0, 7);
  const mealsPerDay = clamp(Math.round(num(profile.mealsPerDay) ?? 4), 2, 6);
  const sleepTargetHours = clamp(num(profile.sleepTargetHours) ?? 8, 6, 10);
  const missing = [];
  if (!weightKg) missing.push("weight");
  if (!heightCm) missing.push("height");
  if (!age) missing.push("age");
  if (!sex) missing.push("sex");
  return { imperial, weightKg, heightCm, age, sex, goal, trainingDaysPerWeek, mealsPerDay, sleepTargetHours, missing };
};

const activityFactor = (days) => (days <= 1 ? 1.3 : days <= 3 ? 1.45 : days <= 5 ? 1.6 : 1.7);

// Calories and macros for one day. Training days get more carbs and rest days fewer, so the
// weekly average still matches the target.
export const computeMacros = (inputs, { isTrainingDay = false } = {}) => {
  const { weightKg, heightCm, age, sex, goal, trainingDaysPerWeek } = inputs;
  if (!weightKg) return null;

  // Very high bodyweight: base protein on a reference weight (BMI 27) instead of total weight.
  const bmi = heightCm ? weightKg / (heightCm / 100) ** 2 : null;
  const proteinWeight = bmi && bmi > 30 ? 27 * (heightCm / 100) ** 2 : weightKg;
  let proteinPerKg = goal === "cut" ? 2.2 : goal === "gain" ? 2.0 : 1.8;
  if (trainingDaysPerWeek <= 1) proteinPerKg = Math.max(1.6, proteinPerKg - 0.2);
  const protein = round(proteinWeight * proteinPerKg, 5);

  const fullFormula = Boolean(heightCm && age);
  const bmr = fullFormula ? 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : sex === "female" ? -161 : -78) : 22 * weightKg;
  const tdee = bmr * activityFactor(trainingDaysPerWeek);
  let target = tdee;
  if (goal === "cut") target = Math.max(bmr * 1.05, tdee - Math.min(tdee * 0.2, 750));
  if (goal === "gain") target = tdee + Math.min(tdee * 0.1, 400);

  const fat = Math.max(round((target * 0.25) / 9, 5), round(weightKg * 0.6, 5));
  const baseCarbs = Math.max(50, round((target - protein * 4 - fat * 9) / 4, 5));

  let carbs = baseCarbs;
  const cycling = trainingDaysPerWeek > 0 && trainingDaysPerWeek < 7;
  if (cycling) {
    const boost = baseCarbs * 0.15;
    const cut = Math.min(baseCarbs * 0.25, (boost * trainingDaysPerWeek) / (7 - trainingDaysPerWeek));
    carbs = Math.max(50, round(isTrainingDay ? baseCarbs + boost : baseCarbs - cut, 5));
  }
  const calories = round(protein * 4 + carbs * 4 + fat * 9, 10);

  return {
    calories,
    protein,
    carbs,
    fat,
    proteinPerKg: Math.round((protein / weightKg) * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    weeklyAverageCalories: round(protein * 4 + baseCarbs * 4 + fat * 9, 10),
    method: fullFormula ? "mifflin" : "estimate",
    adjustedForBmi: proteinWeight !== weightKg,
    cycling
  };
};

export const creatinePhase = ({ profile = {}, day, weightKg }) => {
  const maintenanceGrams = weightKg && weightKg < 60 ? 3 : 5;
  if (profile.creatineMode === "load" && profile.creatineStartedOn && day) {
    const dayIndex = daysBetween(profile.creatineStartedOn, day);
    if (dayIndex >= 0 && dayIndex < CREATINE_LOADING_DAYS) {
      // About 0.3 g/kg a day (15-20 g), in 5 g doses spread across meals.
      const doses = clamp(Math.round(((weightKg || 70) * 0.3) / 5), 3, 4);
      return { phase: "loading", loadingDay: dayIndex + 1, loadingDays: CREATINE_LOADING_DAYS, doses, gramsPerDose: 5 };
    }
    if (dayIndex >= CREATINE_LOADING_DAYS) return { phase: "maintenance", justFinishedLoading: dayIndex === CREATINE_LOADING_DAYS, doses: 1, gramsPerDose: maintenanceGrams };
  }
  return { phase: "maintenance", doses: 1, gramsPerDose: maintenanceGrams };
};

export const waterTargetMl = ({ weightKg, isTrainingDay, creatineLoading }) => {
  const base = (weightKg || 70) * 35 + (isTrainingDay ? 500 : 0) + (creatineLoading ? 250 : 0);
  return clamp(round(base, 250), 2000, 5000);
};

const supplementPlan = ({ profile, day, inputs, isTrainingDay, sleepHours }) =>
  (profile.supplements || [])
    .filter((key) => SUPPLEMENTS[key])
    .filter((key) => !SUPPLEMENTS[key].trainingOnly || isTrainingDay)
    .map((key) => {
      const base = { key, label: SUPPLEMENTS[key].label, timing: SUPPLEMENTS[key].timing, doses: 1, doseLabel: "1 serving" };
      if (key === "creatine") {
        const phase = creatinePhase({ profile, day, weightKg: inputs.weightKg });
        return {
          ...base,
          ...phase,
          doseLabel: `${phase.gramsPerDose} g`,
          timing: phase.phase === "loading" ? "Spread across your meals" : base.timing,
          note:
            phase.phase === "loading"
              ? `Loading day ${phase.loadingDay} of ${phase.loadingDays}: ${phase.doses} doses of 5 g. If it upsets your stomach, switch to ${phase.gramsPerDose === 3 ? 3 : 5} g a day; you'll get there in about 3-4 weeks instead.`
              : phase.justFinishedLoading
                ? `Loading done. ${phase.gramsPerDose} g a day keeps your muscles topped up.`
                : `${phase.gramsPerDose} g a day. Timing barely matters; taking it every day does.`
        };
      }
      if (key === "whey") return { ...base, doseLabel: "1 scoop", note: `About ${WHEY_PROTEIN_PER_SCOOP} g protein, counted toward your protein.` };
      if (key === "caffeine")
        return {
          ...base,
          note:
            sleepHours !== null && sleepHours < 6
              ? "Short night: keep it before 2 pm so tonight's sleep isn't cut short too."
              : "Keep it at least 8 hours before bed."
        };
      if (key === "magnesium") return { ...base, note: "Some people find it helps them wind down." };
      return { ...base, note: "Follow the dose on the label." };
    });

// The whole day: targets, supplements, sleep, and short tips that explain the numbers.
export const buildDailyPlan = ({ user = {}, profile = {}, day, isTrainingDay = false, trainingSource = "none", checkIn = {} }) => {
  const sleepHours = num(checkIn.sleepHours);
  const energy = num(checkIn.energy);
  const inputs = resolveInputs({ user, profile, morningWeight: checkIn.morningWeight });
  const macros = computeMacros(inputs, { isTrainingDay });
  const supplements = supplementPlan({ profile, day, inputs, isTrainingDay, sleepHours });
  const creatine = supplements.find((item) => item.key === "creatine");
  const waterMl = waterTargetMl({ weightKg: inputs.weightKg, isTrainingDay, creatineLoading: creatine?.phase === "loading" });
  const meals = macros
    ? {
        count: inputs.mealsPerDay,
        protein: round(macros.protein / inputs.mealsPerDay, 5),
        carbs: round(macros.carbs / inputs.mealsPerDay, 5),
        fat: round(macros.fat / inputs.mealsPerDay, 5)
      }
    : { count: inputs.mealsPerDay, protein: 0, carbs: 0, fat: 0 };

  const sleepTarget = inputs.sleepTargetHours;
  const shortNight = sleepHours !== null && sleepHours < sleepTarget - 1;
  const sleep = {
    lastNight: sleepHours,
    targetTonight: shortNight ? Math.min(10, sleepTarget + 0.5) : sleepTarget,
    status: sleepHours === null ? "unknown" : sleepHours >= sleepTarget - 0.5 ? "good" : shortNight ? "short" : "close"
  };

  const tips = [];
  if (inputs.missing.includes("weight")) tips.push({ key: "weight", tone: "warn", text: "Add your weight to get protein, calorie and water targets." });
  if (sleepHours !== null && sleepHours < 6) {
    tips.push({
      key: "short-sleep",
      tone: "warn",
      text: isTrainingDay
        ? "Under 6 hours of sleep: still train, but keep your usual weights and drop a back-off set. Hit your protein; it matters more when you're under-recovered."
        : "Under 6 hours of sleep: an easy walk and an earlier night will do more than caffeine today."
    });
  } else if (sleep.status === "good") {
    tips.push({ key: "good-sleep", tone: "good", text: isTrainingDay ? "Well rested: a good day to push a top set." : "Well rested. Nice." });
  }
  if (energy !== null && energy <= 2) {
    tips.push({
      key: "low-energy",
      tone: "warn",
      text: isTrainingDay
        ? "Low energy: warm up longer, and if the first working set feels heavy, take 5-10% off for the day."
        : "Low energy: eat on time and drink your water; both are common culprits."
    });
  }
  if (trainingSource === "none" && !checkIn.at)
    tips.push({ key: "training-unknown", tone: "info", text: "Training today? Say so in the check-in for a training-day plan." });
  if (creatine?.phase === "loading" && creatine.loadingDay === 1)
    tips.push({ key: "creatine-start", tone: "info", text: "First day of creatine loading. Spread the doses out and drink a bit more water." });

  const reasons = [];
  if (macros) {
    const goalText = inputs.goal === "cut" ? "losing fat" : inputs.goal === "gain" ? "building muscle" : "maintaining";
    reasons.push({
      key: "protein",
      title: `Protein ${macros.protein} g`,
      text: `${macros.proteinPerKg} g per kg of bodyweight, the evidence-backed range for ${goalText} while training.${macros.adjustedForBmi ? " Based on a reference weight for your height, since total weight overshoots protein needs at higher body fat." : ""}`
    });
    reasons.push({
      key: "calories",
      title: `${macros.calories} kcal today`,
      text: `${macros.method === "mifflin" ? "From your height, weight, age and" : "Estimated from your weight and"} ${inputs.trainingDaysPerWeek} training day${inputs.trainingDaysPerWeek === 1 ? "" : "s"} a week (about ${macros.tdee} kcal to maintain)${inputs.goal === "cut" ? ", minus a moderate deficit" : inputs.goal === "gain" ? ", plus a small surplus" : ""}.${macros.cycling ? ` ${isTrainingDay ? "Training day: extra carbs to fuel the session." : "Rest day: slightly fewer carbs."} Your weekly average stays at ${macros.weeklyAverageCalories} kcal.` : ""}${macros.method === "estimate" ? " Add your height and age for a sharper number." : ""}`
    });
    reasons.push({ key: "water", title: "Water", text: `About 35 ml per kg${isTrainingDay ? ", plus 500 ml for training" : ""}${creatine?.phase === "loading" ? ", plus a little extra while loading creatine" : ""}.` });
  }

  return { day, isTrainingDay, trainingSource, inputs, macros, waterMl, meals, supplements, sleep, tips, reasons };
};

// Totals as the user sees them: their own entries plus ticked meals and whey scoops.
export const intakeTotals = (log = {}) => {
  const manual = log.intake || {};
  const meals = (log.meals || []).filter((meal) => meal?.done);
  const whey = Number(log.supplements?.whey) || 0;
  const sum = (key) => meals.reduce((total, meal) => total + (Number(meal[key]) || 0), 0);
  return {
    protein: Math.max(0, (Number(manual.protein) || 0) + sum("protein") + whey * WHEY_PROTEIN_PER_SCOOP),
    carbs: Math.max(0, (Number(manual.carbs) || 0) + sum("carbs")),
    fat: Math.max(0, (Number(manual.fat) || 0) + sum("fat")),
    waterMl: Math.max(0, Number(manual.waterMl) || 0)
  };
};

// The day's checklist. Sleep tonight is advice, not a to-do: it can only be known tomorrow.
export const buildTodos = (plan, log = {}) => {
  const totals = intakeTotals(log);
  const todos = [];
  todos.push({ key: "checkin", kind: "checkin", label: "Morning check-in", done: Boolean(log.checkIn?.at) });
  if (plan.macros) {
    for (const key of ["protein", "carbs", "fat"]) {
      const target = plan.macros[key];
      todos.push({ key, kind: "macro", label: key === "protein" ? "Protein" : key === "carbs" ? "Carbs" : "Fat", unit: "g", target, value: totals[key], done: totals[key] >= target * HIT });
    }
  }
  todos.push({ key: "water", kind: "water", label: "Water", unit: "ml", target: plan.waterMl, value: totals.waterMl, done: totals.waterMl >= plan.waterMl * 0.95 });
  const mealsDone = (log.meals || []).slice(0, plan.meals.count).filter((meal) => meal?.done).length;
  todos.push({ key: "meals", kind: "meals", label: `${plan.meals.count} meals`, target: plan.meals.count, value: mealsDone, done: mealsDone >= plan.meals.count });
  for (const supplement of plan.supplements) {
    const taken = Math.min(supplement.doses, Number(log.supplements?.[supplement.key]) || 0);
    todos.push({ key: `supplement:${supplement.key}`, kind: "supplement", label: supplement.label, target: supplement.doses, value: taken, done: taken >= supplement.doses });
  }
  const done = todos.filter((todo) => todo.done).length;
  return { todos, totals, completion: { done, total: todos.length } };
};
