import ReportStatGrid from "./ReportStatGrid.jsx";

const MonthlyReportSummary = ({ report }) => {
  if (!report) return null;

  return (
    <section className="metal-panel rounded-lg p-5">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">{report.title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{report.summary}</p>
      <div className="mt-5">
        <ReportStatGrid report={report} />
      </div>
    </section>
  );
};

export default MonthlyReportSummary;
