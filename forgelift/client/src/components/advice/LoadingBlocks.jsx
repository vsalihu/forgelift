const LoadingBlocks = ({ label = "Loading", hero = "h-64", rows = 3 }) => (
  <div aria-busy="true" aria-label={label} className="space-y-3">
    <div className={`${hero} animate-pulse rounded-[2rem] bg-white/[0.04]`} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, index) => (
        <div className="h-40 animate-pulse rounded-3xl bg-white/[0.03]" key={index} />
      ))}
    </div>
  </div>
);

export default LoadingBlocks;
