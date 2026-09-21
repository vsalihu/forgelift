import User from "../models/User.js";

const sanitize = (value) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16) || "user";

export const backfillUsernames = async () => {
  const usersMissingUsername = await User.find({
    $or: [{ username: { $exists: false } }, { username: null }, { username: "" }]
  });

  let updated = 0;

  for (const user of usersMissingUsername) {
    const base = sanitize(user.email?.split("@")[0]);
    let candidate = base.length >= 3 ? base : `${base}user`;
    let suffix = 0;

    while (await User.exists({ username: candidate, _id: { $ne: user._id } })) {
      suffix += 1;
      candidate = `${base}${suffix}`.slice(0, 20);
    }

    await User.updateOne({ _id: user._id }, { $set: { username: candidate } });
    updated += 1;
  }

  return { checked: usersMissingUsername.length, updated };
};
