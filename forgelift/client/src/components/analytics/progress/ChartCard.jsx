import { useState } from "react";

const ChartCard = ({ title, description, action, footer, table, empty, emptyMessage, className = "", tourId, children }) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <section
      className={`min-w-0 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-6 ${className}`}
      data-tour-id={tourId}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-tight text-white sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
          {table && !empty ? (
            <button
              aria-pressed={showTable}
              className="min-h-10 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? "Show chart" : "Show as table"}
            </button>
          ) : null}
        </div>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-white/12 p-6 text-center text-sm leading-6 text-zinc-400">{emptyMessage}</div>
      ) : showTable && table ? (
        <div className="max-h-80 overflow-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0e1014] text-xs text-zinc-400">
              <tr>
                {table.columns.map((column) => (
                  <th className="px-3 py-2.5 font-semibold" key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums text-zinc-200">
              {table.rows.map((row, index) => (
                <tr className="border-t border-white/[0.05]" key={index}>
                  {table.columns.map((column) => (
                    <td className="px-3 py-2" key={column.key}>
                      {row[column.key] ?? "–"}
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

      {footer && !empty ? <div className="mt-5 border-t border-white/[0.06] pt-4">{footer}</div> : null}
    </section>
  );
};

export default ChartCard;
