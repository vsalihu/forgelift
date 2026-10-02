// The muscle map behind the workout builder's coverage meters.
//
// Exercise data only says which muscles an exercise hits ("Biceps": 80), not which part of the muscle.
// This file turns that into stimulus per muscle part (biceps long head, lower back, ...) using the
// exercise's name and movement pattern, then measures a workout against a per-session target.

export const MUSCLE_GROUPS = [
  { id: "chest", label: "Chest", image: "chest", parts: [["upper", "Upper chest"], ["mid", "Mid chest"], ["lower", "Lower chest"]] },
  { id: "back", label: "Back", image: "upper-back", parts: [["lats", "Lats"], ["mid", "Mid back"], ["traps", "Traps", 0.75], ["lower", "Lower back", 0.75]] },
  { id: "shoulders", label: "Shoulders", image: "side-delts", parts: [["front", "Front delts"], ["side", "Side delts"], ["rear", "Rear delts"]] },
  { id: "biceps", label: "Biceps", image: "biceps", parts: [["long", "Long head"], ["short", "Short head"], ["brachialis", "Brachialis", 0.75]] },
  { id: "triceps", label: "Triceps", image: "triceps", parts: [["long", "Long head"], ["lateral", "Lateral & medial heads"]] },
  { id: "forearms", label: "Forearms", image: "forearms", parts: [["brachioradialis", "Brachioradialis", 0.75], ["grip", "Grip & wrist", 0.75]] },
  { id: "quads", label: "Quads", image: "quads", parts: [["quads", "Quads"]] },
  { id: "hamstrings", label: "Hamstrings", image: "hamstrings-calves", parts: [["hinge", "Upper (hip hinge)"], ["curl", "Lower (knee curl)"]] },
  { id: "glutes", label: "Glutes", image: "glutes", parts: [["max", "Glute max"], ["med", "Side glutes", 0.75]] },
  { id: "calves", label: "Calves", image: "hamstrings-calves", parts: [["gastroc", "Calves (straight leg)"], ["soleus", "Soleus (bent knee)", 0.75]] },
  { id: "core", label: "Core", image: "abs", parts: [["abs", "Abs"], ["obliques", "Obliques", 0.75]] }
].map((group) => ({
  ...group,
  parts: group.parts.map(([key, label, scale = 1]) => ({ id: `${group.id}.${key}`, key, label, scale, groupId: group.id }))
}));

export const GROUPS_BY_ID = Object.fromEntries(MUSCLE_GROUPS.map((group) => [group.id, group]));
export const PARTS_BY_ID = Object.fromEntries(MUSCLE_GROUPS.flatMap((group) => group.parts.map((part) => [part.id, { ...part, groupLabel: group.label }])));

export const PRESETS = [
  { id: "push", label: "Push", groups: ["chest", "shoulders", "triceps"] },
  { id: "pull", label: "Pull", groups: ["back", "biceps", "forearms"] },
  { id: "legs", label: "Legs", groups: ["quads", "hamstrings", "glutes", "calves"] },
  { id: "upper", label: "Upper body", groups: ["chest", "back", "shoulders", "biceps", "triceps"] },
  { id: "lower", label: "Lower body", groups: ["quads", "hamstrings", "glutes", "calves", "core"] },
  { id: "full", label: "Full body", groups: ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "core"] },
  { id: "back-biceps", label: "Back & biceps", groups: ["back", "biceps"] },
  { id: "chest-triceps", label: "Chest & triceps", groups: ["chest", "triceps"] },
  { id: "shoulders-arms", label: "Shoulders & arms", groups: ["shoulders", "biceps", "triceps"] }
];

// Effective sets that make a part "full" in one session. Smaller parts (scale < 1) need less.
const BASE_TARGET = { Beginner: 3, Intermediate: 4, Advanced: 5 };
// One exercise can fill at most this share of a part, so a part needs some variety to be fully trained.
export const SINGLE_EXERCISE_CAP = 0.6;
// Past this share of the target (counting every set, capped or not) a part is flagged as too much.
export const OVER_LIMIT = 1.75;
// Below this, a muscle is only stabilising and doesn't count as training it.
const MIN_STIMULUS = 0.2;

export const partTarget = (part, experience) => (BASE_TARGET[experience] || 4) * (part.scale || 1);

// Name and movement-pattern rules ------------------------------------------------------------

const has = (ctx, pattern) => pattern.test(ctx.name);
const pat = (ctx, ...patterns) => patterns.includes(ctx.pattern);

const RULES = {
  Chest: (ctx) =>
    has(ctx, /incline|low[- ]to[- ]high/) || pat(ctx, "incline press")
      ? { "chest.upper": 0.7, "chest.mid": 0.3 }
      : has(ctx, /decline|dip|high[- ]to[- ]low/) || pat(ctx, "decline press", "dip")
        ? { "chest.lower": 0.7, "chest.mid": 0.3 }
        : { "chest.mid": 0.6, "chest.upper": 0.2, "chest.lower": 0.2 },
  "Mid Chest": () => ({ "chest.mid": 1 }),
  "Inner Chest": () => ({ "chest.mid": 1 }),
  "Upper Chest": () => ({ "chest.upper": 1 }),
  "Lower Chest": () => ({ "chest.lower": 1 }),

  Back: (ctx) =>
    has(ctx, /shrug/) || pat(ctx, "shrug")
      ? { "back.traps": 1 }
      : has(ctx, /pull[- ]?up|chin[- ]?up|pulldown|pull[- ]?over|straight[- ]arm/) || pat(ctx, "vertical pull", "pulldown")
        ? { "back.lats": 0.75, "back.mid": 0.25 }
        : has(ctx, /row/) || pat(ctx, "horizontal pull")
          ? { "back.mid": 0.55, "back.lats": 0.35, "back.traps": 0.1 }
          : has(ctx, /deadlift|good morning|rack pull|extension|hyperextension|superman/) || pat(ctx, "hinge", "hip extension")
            ? { "back.lower": 0.6, "back.traps": 0.25, "back.mid": 0.15 }
            : { "back.lats": 0.4, "back.mid": 0.4, "back.traps": 0.2 },
  Lats: () => ({ "back.lats": 1 }),
  "Teres Major": () => ({ "back.lats": 1 }),
  "Mid Back": () => ({ "back.mid": 1 }),
  Rhomboids: () => ({ "back.mid": 1 }),
  "Upper Back": () => ({ "back.mid": 0.7, "back.traps": 0.3 }),
  Traps: () => ({ "back.traps": 1 }),
  "Lower Traps": () => ({ "back.traps": 0.6, "back.mid": 0.4 }),
  "Lower Back": () => ({ "back.lower": 1 }),

  Shoulders: (ctx) =>
    has(ctx, /lateral|upright|side raise|y[- ]raise/)
      ? { "shoulders.side": 1 }
      : has(ctx, /rear|face pull|reverse fly|reverse pec|band pull/) || pat(ctx, "rear delt pull", "rear delt fly")
        ? { "shoulders.rear": 1 }
        : has(ctx, /front raise/)
          ? { "shoulders.front": 1 }
          : has(ctx, /press|push/) || pat(ctx, "vertical press", "angled press")
            ? { "shoulders.front": 0.7, "shoulders.side": 0.3 }
            : { "shoulders.front": 0.4, "shoulders.side": 0.4, "shoulders.rear": 0.2 },
  "Front Delts": () => ({ "shoulders.front": 1 }),
  "Front Shoulders": () => ({ "shoulders.front": 1 }),
  "Side Delts": () => ({ "shoulders.side": 1 }),
  "Rear Delts": () => ({ "shoulders.rear": 1 }),

  Biceps: (ctx) =>
    has(ctx, /hammer|reverse|cross[- ]?body|pinwheel|zottman/)
      ? { "biceps.brachialis": 0.6, "biceps.long": 0.2, "biceps.short": 0.2 }
      : has(ctx, /incline|drag|bayesian|behind/)
        ? { "biceps.long": 0.65, "biceps.short": 0.35 }
        : has(ctx, /preacher|concentration|spider|scott|wide/)
          ? { "biceps.short": 0.65, "biceps.long": 0.35 }
          : { "biceps.long": 0.45, "biceps.short": 0.45, "biceps.brachialis": 0.1 },
  "Biceps Long Head": () => ({ "biceps.long": 1 }),
  "Biceps Short Head": () => ({ "biceps.short": 1 }),
  Brachialis: () => ({ "biceps.brachialis": 1 }),

  Triceps: (ctx) =>
    has(ctx, /overhead|skull|french|lying|jm press/)
      ? { "triceps.long": 0.65, "triceps.lateral": 0.35 }
      : has(ctx, /pushdown|push[- ]down|kickback|dip|close[- ]grip|diamond|press|push[- ]?up/)
        ? { "triceps.lateral": 0.65, "triceps.long": 0.35 }
        : { "triceps.long": 0.5, "triceps.lateral": 0.5 },
  "Triceps Long Head": () => ({ "triceps.long": 1 }),
  "Triceps Lateral Head": () => ({ "triceps.lateral": 1 }),
  "Triceps Medial Head": () => ({ "triceps.lateral": 1 }),

  Arms: (ctx) => (pat(ctx, "elbow extension") ? RULES.Triceps(ctx) : pat(ctx, "elbow flexion") ? RULES.Biceps(ctx) : {}),

  Forearms: () => ({ "forearms.grip": 1 }),
  Grip: () => ({ "forearms.grip": 1 }),
  Brachioradialis: () => ({ "forearms.brachioradialis": 1 }),

  Legs: (ctx) =>
    pat(ctx, "knee flexion") || has(ctx, /leg curl|hamstring curl|nordic/)
      ? { "hamstrings.curl": 1 }
      : pat(ctx, "knee extension") || has(ctx, /leg extension/)
        ? { "quads.quads": 1 }
        : pat(ctx, "calf raise") || has(ctx, /calf/)
          ? RULES.Calves(ctx)
          : pat(ctx, "hinge", "single leg hinge", "hip extension") || has(ctx, /deadlift|good morning|romanian|rdl|swing/)
            ? { "hamstrings.hinge": 0.7, "quads.quads": 0.3 }
            : { "quads.quads": 0.8, "hamstrings.hinge": 0.2 },
  Quads: () => ({ "quads.quads": 1 }),

  Hamstrings: (ctx) =>
    pat(ctx, "knee flexion") || has(ctx, /curl|nordic|glute[- ]ham/)
      ? { "hamstrings.curl": 1 }
      : pat(ctx, "hinge", "single leg hinge", "hip extension") || has(ctx, /deadlift|good morning|romanian|rdl|stiff|swing|thrust|bridge|extension/)
        ? { "hamstrings.hinge": 1 }
        : { "hamstrings.hinge": 0.5, "hamstrings.curl": 0.5 },

  Glutes: (ctx) =>
    pat(ctx, "hip abduction") || has(ctx, /abduct|clam|side[- ]lying|lateral band|monster walk|lateral walk/)
      ? { "glutes.med": 1 }
      : pat(ctx, "single leg", "single leg hinge") || has(ctx, /lunge|split|step[- ]?up|single[- ]leg|pistol/)
        ? { "glutes.max": 0.75, "glutes.med": 0.25 }
        : { "glutes.max": 1 },
  "Glute Maximus": () => ({ "glutes.max": 1 }),
  "Glute Medius": () => ({ "glutes.med": 1 }),
  "Glute Minimus": () => ({ "glutes.med": 1 }),
  Abductors: () => ({ "glutes.med": 1 }),

  Calves: (ctx) => (has(ctx, /seated|bent[- ]knee/) ? { "calves.soleus": 0.8, "calves.gastroc": 0.2 } : { "calves.gastroc": 0.7, "calves.soleus": 0.3 }),

  Core: (ctx) =>
    pat(ctx, "rotation", "anti-rotation", "anti-lateral flexion") || has(ctx, /oblique|twist|side plank|side bend|woodchop|wood chop|pallof|windmill|suitcase|russian/)
      ? { "core.obliques": 0.7, "core.abs": 0.3 }
      : { "core.abs": 0.8, "core.obliques": 0.2 },
  Abs: (ctx) => RULES.Core(ctx),
  "Transverse Abdominis": () => ({ "core.abs": 1 }),
  Obliques: () => ({ "core.obliques": 1 })
};

const impactOf = (exercise) => {
  const profile = exercise?.impactProfile || {};
  if (Object.keys(profile).length) return profile;
  // No impact data: fall back to the muscle lists.
  const fallback = {};
  (exercise?.primaryMuscles || []).forEach((muscle) => (fallback[muscle] = 100));
  (exercise?.secondaryMuscles || []).forEach((muscle) => (fallback[muscle] = fallback[muscle] || 40));
  return fallback;
};

const stimulusCache = new WeakMap();

// How much one hard set of this exercise counts for each muscle part, 0 to 1.
// Overlapping labels ("Back" and "Lats" on a pulldown) take the strongest value instead of adding up.
export const partStimulus = (exercise) => {
  if (!exercise) return {};
  if (typeof exercise === "object" && stimulusCache.has(exercise)) return stimulusCache.get(exercise);
  const ctx = { name: String(exercise.name || exercise.exerciseName || "").toLowerCase(), pattern: exercise.movementPattern || "" };
  const result = {};
  Object.entries(impactOf(exercise)).forEach(([muscle, impact]) => {
    const value = (Number(impact) || 0) / 100;
    if (value < MIN_STIMULUS || !RULES[muscle]) return;
    Object.entries(RULES[muscle](ctx)).forEach(([partId, share]) => {
      result[partId] = Math.max(result[partId] || 0, Math.min(1, value * share));
    });
  });
  Object.keys(result).forEach((partId) => {
    if (result[partId] < 0.15) delete result[partId];
  });
  stimulusCache.set(exercise, result);
  return result;
};

// Coverage -----------------------------------------------------------------------------------

export const fillStatus = (fill) => {
  if (fill <= 0) return { key: "none", label: "Not hit" };
  if (fill < 0.5) return { key: "light", label: "Light" };
  if (fill < 0.9) return { key: "almost", label: "Almost" };
  if (fill <= OVER_LIMIT) return { key: "hit", label: "Hit" };
  return { key: "over", label: "Too much" };
};

// items: [{ exercise, sets }]. Returns per-part effective sets and fill, plus per-group and overall coverage.
export const computeCoverage = (items, groupIds, experience) => {
  const effective = {};
  const raw = {};
  const contributors = {};
  items.forEach(({ exercise, sets }, index) => {
    const count = Number(sets) || 0;
    if (!exercise || !count) return;
    Object.entries(partStimulus(exercise)).forEach(([partId, stimulus]) => {
      const part = PARTS_BY_ID[partId];
      const cap = SINGLE_EXERCISE_CAP * partTarget(part, experience);
      const added = Math.min(count * stimulus, cap);
      effective[partId] = (effective[partId] || 0) + added;
      raw[partId] = (raw[partId] || 0) + count * stimulus;
      (contributors[partId] = contributors[partId] || []).push({ index, name: exercise.name || exercise.exerciseName, sets: added });
    });
  });

  const partFill = (part) => (effective[part.id] || 0) / partTarget(part, experience);
  const groups = groupIds
    .map((id) => GROUPS_BY_ID[id])
    .filter(Boolean)
    .map((group) => {
      const parts = group.parts.map((part) => {
        const fill = partFill(part);
        const target = partTarget(part, experience);
        // Over the top is judged on total sets, so one exercise piled high still gets flagged.
        const status = (raw[part.id] || 0) / target > OVER_LIMIT ? fillStatus(2) : fillStatus(fill);
        const capped = contributors[part.id]?.length === 1 && (raw[part.id] || 0) > (effective[part.id] || 0) + 0.01;
        return { ...part, effective: effective[part.id] || 0, raw: raw[part.id] || 0, target, fill, status, capped, contributors: contributors[part.id] || [] };
      });
      const fill = parts.reduce((sum, part) => sum + Math.min(part.fill, 1), 0) / parts.length;
      return { ...group, parts, fill, over: parts.some((part) => part.status.key === "over") };
    });
  const overall = groups.length ? groups.reduce((sum, group) => sum + group.fill, 0) / groups.length : 0;

  // Parts filled from outside the chosen groups, for the body map.
  const allFills = Object.fromEntries(Object.keys(PARTS_BY_ID).map((partId) => [partId, partFill(PARTS_BY_ID[partId])]));
  return { groups, overall, allFills };
};

// Suggestions ----------------------------------------------------------------------------------

const DEFAULT_SETS = 3;
const isCompound = (exercise) => exercise.exerciseType === "compound";

// Useful gain from adding an exercise: what it adds to chosen parts that still need it.
const usefulGain = (exercise, needs, experience) =>
  Object.entries(partStimulus(exercise)).reduce((sum, [partId, stimulus]) => {
    if (!(partId in needs)) return sum;
    const part = PARTS_BY_ID[partId];
    const gain = Math.min(DEFAULT_SETS * stimulus, SINGLE_EXERCISE_CAP * partTarget(part, experience));
    return sum + Math.min(gain, needs[partId]);
  }, 0);

const needsFor = (coverage) =>
  Object.fromEntries(coverage.groups.flatMap((group) => group.parts.map((part) => [part.id, Math.max(0, part.target * 0.95 - part.effective)])));

// Exercises that hit a part, best first. "fill" is how much of the part 3 sets would add (0 to 1).
export const exercisesForPart = (partId, library, { experience, coverage, inWorkout = new Set() } = {}) => {
  const part = PARTS_BY_ID[partId];
  if (!part) return [];
  const target = partTarget(part, experience);
  const needs = coverage ? needsFor(coverage) : {};
  return library
    .map((exercise) => {
      const stimulus = partStimulus(exercise)[partId] || 0;
      return {
        exercise,
        stimulus,
        fill: Math.min(DEFAULT_SETS * stimulus, SINGLE_EXERCISE_CAP * target) / target,
        alsoHelps: usefulGain(exercise, needs, experience),
        added: inWorkout.has(exercise._id) || inWorkout.has(exercise.name)
      };
    })
    .filter((item) => item.stimulus >= 0.3)
    .sort((a, b) => b.stimulus - a.stimulus || b.alsoHelps - a.alsoHelps || Number(isCompound(b.exercise)) - Number(isCompound(a.exercise)) || a.exercise.name.localeCompare(b.exercise.name));
};

// The single best addition for the emptiest chosen part.
export const bestGapFill = (coverage, library, { experience, inWorkout = new Set() } = {}) => {
  const parts = coverage.groups.flatMap((group) => group.parts).filter((part) => part.fill < 0.9).sort((a, b) => a.fill - b.fill);
  if (!parts.length) return null;
  const needs = needsFor(coverage);
  const target = parts[0];
  const candidates = library.filter((exercise) => !inWorkout.has(exercise._id) && !inWorkout.has(exercise.name) && (partStimulus(exercise)[target.id] || 0) >= 0.3);
  if (!candidates.length) return null;
  const scored = candidates
    .map((exercise) => ({ exercise, score: usefulGain(exercise, needs, experience) + (partStimulus(exercise)[target.id] || 0) }))
    .sort((a, b) => b.score - a.score);
  return { part: target, exercise: scored[0].exercise };
};

// Moves that don't belong in a hypertrophy-style auto-built session.
const SKIP_PATTERNS = ["power", "conditioning", "cardio", "carry", "squat to press"];
const tooAdvanced = (exercise, experience) => experience === "Beginner" && exercise.difficulty === "Advanced";

// Going well past a part's target is wasted effort; the penalty keeps auto-build from stacking similar lifts.
const overshoot = (exercise, coverage, experience) =>
  coverage.groups.reduce(
    (sum, group) =>
      sum +
      group.parts.reduce((partSum, part) => {
        const stimulus = partStimulus(exercise)[part.id] || 0;
        if (!stimulus) return partSum;
        const after = part.raw + DEFAULT_SETS * stimulus;
        return partSum + Math.max(0, after - 1.3 * part.target) / part.target;
      }, 0),
    0
  );

// A balanced workout for the chosen groups: keep adding the exercise that fills the most remaining need.
export const autoBuild = (groupIds, library, { experience, startWith = [], maxExercises } = {}) => {
  const limit = maxExercises || Math.min(7, 2 + 2 * groupIds.length);
  const items = [...startWith];
  const used = new Set(items.flatMap((item) => [item.exercise?._id, item.exercise?.name].filter(Boolean)));
  const pool = library.filter((exercise) => exercise.exerciseType !== "cardio" && !SKIP_PATTERNS.includes(exercise.movementPattern) && !tooAdvanced(exercise, experience));
  while (items.length < startWith.length + limit) {
    const coverage = computeCoverage(items, groupIds, experience);
    const needs = needsFor(coverage);
    // Work on the emptiest part first, so every chosen group gets attention before any is topped up.
    const openParts = coverage.groups.flatMap((group) => group.parts).filter((part) => part.fill < 0.9).sort((a, b) => a.fill - b.fill);
    if (!openParts.length) break;
    let best = null;
    for (const focus of openParts) {
      pool.forEach((exercise) => {
        if (used.has(exercise._id) || used.has(exercise.name)) return;
        if ((partStimulus(exercise)[focus.id] || 0) < 0.4) return;
        // Never tip a chosen part into "too much".
        const breaksLimit = coverage.groups.some((group) =>
          group.parts.some((part) => part.raw + DEFAULT_SETS * (partStimulus(exercise)[part.id] || 0) > OVER_LIMIT * part.target)
        );
        if (breaksLimit) return;
        // Small nudge towards compounds so the workout opens with a big lift.
        // Work that lands on muscles nobody asked for (a row on push day) counts against an exercise.
        const offTarget = Object.entries(partStimulus(exercise)).reduce((sum, [partId, value]) => sum + (partId in needs ? 0 : value), 0);
        const score =
          usefulGain(exercise, needs, experience) - 0.6 * overshoot(exercise, coverage, experience) - 0.3 * offTarget + (isCompound(exercise) ? 0.15 : 0);
        if (!best || score > best.score) best = { exercise, score };
      });
      if (best) break;
    }
    if (!best) break;
    used.add(best.exercise._id || best.exercise.name);
    items.push({ exercise: best.exercise, sets: DEFAULT_SETS });
  }
  const added = items.slice(startWith.length);
  // Big lifts first, then the rest in the order they were picked.
  return added.sort((a, b) => Number(isCompound(b.exercise)) - Number(isCompound(a.exercise)));
};

export const groupLabelList = (groupIds) =>
  groupIds
    .map((id) => GROUPS_BY_ID[id]?.label)
    .filter(Boolean)
    .join(" & ")
    .replace(/ & (?=.* & )/g, ", ");
