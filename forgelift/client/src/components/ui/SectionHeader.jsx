const SectionHeader = ({ eyebrow, title, action }) => (
  <div className="mb-5 flex items-center justify-between gap-4">
    <div>
      {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">{eyebrow}</p> : null}
      <h2 className="mt-2 text-xl font-black text-white">{title}</h2>
    </div>
    {action}
  </div>
);

export default SectionHeader;
