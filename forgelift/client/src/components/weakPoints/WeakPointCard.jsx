import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import StatusChip from "../advice/StatusChip.jsx";
import { severityTone } from "../advice/tones.js";
import { getBroadMuscleImage, getMuscleImage } from "../../utils/muscleImages.js";
import { buildEvidenceItems } from "./evidence.js";

const WeakPointCard = ({ weakPoint, index = 0, featured = false }) => {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const items = buildEvidenceItems(weakPoint.evidence);
  const image = weakPoint.muscleGroup ? getMuscleImage(weakPoint.muscleGroup) || getBroadMuscleImage(weakPoint.muscleGroup) : null;
  const detailsId = `weak-${weakPoint._id}`;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-4 sm:p-5 ${featured ? "border-forge-ember/25 bg-gradient-to-b from-forge-ember/[0.07] to-white/[0.01]" : "border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01]"}`}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-3">
        {image ? <img alt="" className="h-12 w-12 shrink-0 rounded-2xl bg-black/30 object-contain p-1" height="48" src={image} width="48" /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={severityTone(weakPoint.severity)}>{weakPoint.severity || "Low"}</StatusChip>
            {weakPoint.muscleGroup ? <span className="text-xs font-semibold text-zinc-500">{weakPoint.muscleGroup}</span> : null}
          </div>
          <h3 className="mt-1.5 text-lg font-bold leading-snug text-white">{weakPoint.title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{weakPoint.message}</p>
      {weakPoint.recommendation ? (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3.5 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">Do this</p>
          <p className="mt-1 text-sm leading-6 text-emerald-50">{weakPoint.recommendation}</p>
        </div>
      ) : null}
      {items.length ? (
        <>
          <button
            aria-controls={detailsId}
            aria-expanded={open}
            className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-orange-300 hover:text-orange-200"
            type="button"
            onClick={() => setOpen((value) => !value)}
          >
            What the numbers say
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? (
            <dl className="mt-2 space-y-3" id={detailsId}>
              {items.map((item) => (
                <div className="rounded-2xl bg-black/25 p-3" key={item.key}>
                  <dt className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-zinc-200">{item.label}</span>
                    <span className="shrink-0 font-bold tabular-nums text-orange-200">{item.value}</span>
                  </dt>
                  {item.explain ? <dd className="mt-1 text-xs leading-5 text-zinc-500">{item.explain}</dd> : null}
                </div>
              ))}
            </dl>
          ) : null}
        </>
      ) : null}
    </motion.article>
  );
};

export default WeakPointCard;
