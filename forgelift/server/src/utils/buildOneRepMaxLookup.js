import PersonalRecord from "../models/PersonalRecord.js";

const normalizeName = (name) => (name || "").trim().toLowerCase();

export const buildOneRepMaxLookup = async (userId, strengthBaselines = []) => {
  const lookup = new Map();

  const personalRecords = await PersonalRecord.find({ userId, recordType: "best_estimated_1rm" })
    .sort({ achievedAt: -1 })
    .select("exerciseId exerciseName value");

  personalRecords.forEach((record) => {
    if (!record.value) return;
    const idKey = record.exerciseId ? String(record.exerciseId) : null;
    const nameKey = normalizeName(record.exerciseName);
    if (idKey && !lookup.has(idKey)) lookup.set(idKey, record.value);
    if (nameKey && !lookup.has(nameKey)) lookup.set(nameKey, record.value);
  });

  (strengthBaselines || []).forEach((baseline) => {
    if (!baseline?.estimatedOneRepMax) return;
    const idKey = baseline.exerciseId ? String(baseline.exerciseId) : null;
    const nameKey = normalizeName(baseline.exerciseName);
    if (idKey && !lookup.has(idKey)) lookup.set(idKey, Number(baseline.estimatedOneRepMax));
    if (nameKey && !lookup.has(nameKey)) lookup.set(nameKey, Number(baseline.estimatedOneRepMax));
  });

  return lookup;
};
