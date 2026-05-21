import PersonalRecord from "../models/PersonalRecord.js";

export const getPersonalRecords = async (req, res) => {
  try {
    const filters = { userId: req.user._id };

    if (req.query.exerciseId) {
      filters.exerciseId = req.query.exerciseId;
    }

    if (req.query.recordType) {
      filters.recordType = req.query.recordType;
    }

    const personalRecords = await PersonalRecord.find(filters).sort({ achievedAt: -1, createdAt: -1 });
    return res.json({ personalRecords });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch personal records.", error: error.message });
  }
};

export const getPersonalRecordTimeline = async (req, res) => {
  try {
    const personalRecords = await PersonalRecord.find({ userId: req.user._id }).sort({
      achievedAt: -1,
      createdAt: -1
    });

    const byDate = personalRecords.reduce((groups, record) => {
      const key = record.achievedAt.toISOString().slice(0, 10);
      groups[key] = groups[key] || [];
      groups[key].push(record);
      return groups;
    }, {});

    const byExercise = personalRecords.reduce((groups, record) => {
      groups[record.exerciseName] = groups[record.exerciseName] || [];
      groups[record.exerciseName].push(record);
      return groups;
    }, {});

    return res.json({ personalRecords, timeline: { byDate, byExercise } });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch PR timeline.", error: error.message });
  }
};

export const getPersonalRecordSummary = async (req, res) => {
  try {
    const personalRecords = await PersonalRecord.find({ userId: req.user._id }).sort({
      achievedAt: -1,
      createdAt: -1
    });

    const bestEstimated1RMByExercise = {};
    const heaviestLiftByExercise = {};

    personalRecords.forEach((record) => {
      if (record.recordType === "best_estimated_1rm") {
        const current = bestEstimated1RMByExercise[record.exerciseName];
        if (!current || record.value > current.value) {
          bestEstimated1RMByExercise[record.exerciseName] = record;
        }
      }

      if (record.recordType === "heaviest_weight") {
        const current = heaviestLiftByExercise[record.exerciseName];
        if (!current || record.value > current.value) {
          heaviestLiftByExercise[record.exerciseName] = record;
        }
      }
    });

    return res.json({
      totalPRs: personalRecords.length,
      latestPR: personalRecords[0] || null,
      bestEstimated1RMByExercise,
      heaviestLiftByExercise
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch PR summary.", error: error.message });
  }
};
