export const createEmptySet = ({ exerciseType = "", bodyweight = "" } = {}) => {
  const isBodyweight = exerciseType === "bodyweight";
  const numericBodyweight = Number(bodyweight) || "";

  return {
    weight: isBodyweight && numericBodyweight ? String(numericBodyweight) : "",
    reps: "",
    rpe: "",
    completed: true,
    notes: "",
    bodyweightOnly: isBodyweight,
    bodyweightUsed: isBodyweight && numericBodyweight ? numericBodyweight : null,
    addedLoad: isBodyweight ? 0 : null,
    totalLoad: isBodyweight && numericBodyweight ? numericBodyweight : ""
  };
};

export const normalizeSetForSave = (set) => {
  const bodyweightUsed = set.bodyweightUsed ? Number(set.bodyweightUsed) : null;
  const addedLoad = set.addedLoad === "" || set.addedLoad === null || set.addedLoad === undefined ? 0 : Number(set.addedLoad);
  const totalLoad = bodyweightUsed ? bodyweightUsed + addedLoad : Number(set.weight) || 0;

  return {
    ...set,
    weight: totalLoad,
    totalLoad,
    bodyweightUsed,
    addedLoad: bodyweightUsed ? addedLoad : null,
    bodyweightOnly: Boolean(set.bodyweightOnly)
  };
};

export const isSetValid = (set) => {
  const normalised = normalizeSetForSave(set);
  return Number(normalised.reps) > 0 && Number(normalised.totalLoad) > 0;
};

export const copySetForNext = (set) => ({
  ...set,
  completed: true,
  notes: ""
});

export const describeSetLoad = (set) => {
  const normalised = normalizeSetForSave(set);
  if (normalised.bodyweightUsed) {
    if (normalised.addedLoad > 0) {
      return `${normalised.bodyweightUsed}kg bodyweight + ${normalised.addedLoad}kg = ${normalised.totalLoad}kg`;
    }
    return `Bodyweight ${normalised.bodyweightUsed}kg`;
  }
  return `${normalised.weight || 0}kg`;
};
