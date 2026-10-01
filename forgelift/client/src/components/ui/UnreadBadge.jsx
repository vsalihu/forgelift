const UnreadBadge = ({ count = 0, className = "" }) => {
  if (!count) return null;

  return (
    <span
      className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-forge-ember px-1.5 py-0.5 text-[11px] font-black leading-none text-[#160a02] ring-2 ring-[#07080a] ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
};

export default UnreadBadge;
