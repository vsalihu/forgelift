const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div>
      {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">{eyebrow}</p> : null}
      <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);

export default PageHeader;
