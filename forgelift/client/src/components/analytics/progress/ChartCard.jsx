import { useState } from "react";

const ChartCard = ({ title, description, action, footer, table, empty, emptyMessage, className = "", children }) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={`metal-panel min-w-0 rounded-xl p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-white sm:text-xl">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
          {table && !empty ? (
            <button
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
              type="button"
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? "Show chart" : "Show as table"}
            </button>
          ) : null}
        </div>
      </div>

      {empty ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-6 text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : showTable && table ? (
        <div className="max-h-80 overflow-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0b0d11] text-xs uppercase tracking-wider text-slate-400">
              <tr>
                {table.columns.map((column) => (
                  <th className="px-3 py-2 font-semibold" key={column.key}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums text-slate-200">
              {table.rows.map((row, index) => (
                <tr className="border-t border-white/5" key={index}>
                  {table.columns.map((column) => (
                    <td className="px-3 py-2" key={column.key}>
                      {row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}

      {footer && !empty ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
};

export default ChartCard;
