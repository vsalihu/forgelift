import { getRankImage } from "../../utils/rankImages.js";

const SIZES = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-lg" };

export const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

// Initials in a circle, ember for you, with the person's rank emblem tucked in the corner.
const Avatar = ({ name, rank, self = false, size = "md" }) => {
  const rankImage = rank ? getRankImage(rank) : null;
  return (
    <span className={`relative inline-flex shrink-0 ${SIZES[size] || SIZES.md}`}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full font-black ${
          self ? "bg-gradient-to-br from-orange-400 to-forge-copper text-[#160a02]" : "bg-gradient-to-br from-zinc-600 to-zinc-800 text-white"
        }`}
      >
        {initialsOf(name)}
      </span>
      {rankImage ? (
        <img alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#0b0d10] object-contain p-0.5" height="20" src={rankImage} width="20" />
      ) : null}
    </span>
  );
};

export default Avatar;
