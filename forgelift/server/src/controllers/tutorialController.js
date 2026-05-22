import TutorialProgress from "../models/TutorialProgress.js";

const normalisePageKey = (pageKey = "") => String(pageKey).trim().toLowerCase();

const upsertProgress = async ({ userId, pageKey, updates }) => {
  const cleanPageKey = normalisePageKey(pageKey);
  const payload = {
    ...(updates.completed !== undefined ? { completed: Boolean(updates.completed) } : {}),
    ...(updates.skipped !== undefined ? { skipped: Boolean(updates.skipped) } : {}),
    ...(updates.lastStep !== undefined ? { lastStep: Math.max(0, Number(updates.lastStep) || 0) } : {}),
    ...(updates.dismissedUntil ? { dismissedUntil: new Date(updates.dismissedUntil) } : {})
  };

  if (payload.completed) {
    payload.completedAt = new Date();
    payload.skipped = false;
  }

  if (payload.skipped) {
    payload.skippedAt = new Date();
  }

  return TutorialProgress.findOneAndUpdate(
    { userId, pageKey: cleanPageKey },
    { $set: payload, $setOnInsert: { userId, pageKey: cleanPageKey } },
    { new: true, upsert: true }
  );
};

export const getTutorialProgress = async (req, res) => {
  const progress = await TutorialProgress.find({ userId: req.user._id }).sort({ pageKey: 1 });
  return res.json({ progress });
};

export const getPageTutorialProgress = async (req, res) => {
  const pageKey = normalisePageKey(req.params.pageKey);
  const progress = await TutorialProgress.findOne({ userId: req.user._id, pageKey });
  return res.json({
    progress:
      progress ||
      {
        pageKey,
        completed: false,
        skipped: false,
        lastStep: 0
      }
  });
};

export const updateTutorialProgress = async (req, res) => {
  const progress = await upsertProgress({
    userId: req.user._id,
    pageKey: req.params.pageKey,
    updates: req.body || {}
  });
  return res.json({ progress });
};

export const resetTutorial = async (req, res) => {
  const pageKey = normalisePageKey(req.params.pageKey);
  await TutorialProgress.deleteOne({ userId: req.user._id, pageKey });
  return res.json({ message: "Tutorial reset.", pageKey });
};

export const resetAllTutorials = async (req, res) => {
  const result = await TutorialProgress.deleteMany({ userId: req.user._id });
  return res.json({ message: "All tutorials reset.", deletedCount: result.deletedCount || 0 });
};
