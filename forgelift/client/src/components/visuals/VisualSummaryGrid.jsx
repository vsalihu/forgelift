const VisualSummaryGrid = ({ children, className = "" }) => (
  <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>
);

export default VisualSummaryGrid;
