import Block from "../models/Block.js";

// Users hidden from each other in either direction.
export const getBlockedUserIds = async (userId) => {
  const blocks = await Block.find({ $or: [{ blockerId: userId }, { blockedId: userId }] }).select("blockerId blockedId");
  return blocks.map((block) => (block.blockerId.equals(userId) ? block.blockedId : block.blockerId));
};

export const isBlockedBetween = async (userIdA, userIdB) =>
  Boolean(
    await Block.exists({
      $or: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA }
      ]
    })
  );
