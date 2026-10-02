import { PARTS_BY_ID } from "../../../utils/muscleMap.js";

// A stylised front/back figure. Each region is one muscle part, shaded by how full it is.
// Shapes are drawn for the left side and mirrored; centred shapes are drawn once.
const FRONT = [
  { part: "shoulders.front", el: "ellipse", a: { cx: 57, cy: 62, rx: 10, ry: 11 } },
  { part: "shoulders.side", el: "ellipse", a: { cx: 46, cy: 67, rx: 6, ry: 11 } },
  { part: "chest.upper", el: "rect", a: { x: 61, y: 54, width: 18, height: 10, rx: 4 } },
  { part: "chest.mid", el: "rect", a: { x: 59, y: 65, width: 20, height: 10, rx: 3 } },
  { part: "chest.lower", el: "rect", a: { x: 61, y: 76, width: 18, height: 8, rx: 4 } },
  { part: "biceps.long", el: "ellipse", a: { cx: 41, cy: 95, rx: 4, ry: 15 } },
  { part: "biceps.short", el: "ellipse", a: { cx: 48, cy: 95, rx: 4, ry: 15 } },
  { part: "biceps.brachialis", el: "ellipse", a: { cx: 44, cy: 114, rx: 5, ry: 4.5 } },
  { part: "forearms.brachioradialis", el: "ellipse", a: { cx: 39, cy: 131, rx: 4.5, ry: 13 } },
  { part: "forearms.grip", el: "ellipse", a: { cx: 46, cy: 137, rx: 4, ry: 13 } },
  { part: "core.obliques", el: "rect", a: { x: 60, y: 90, width: 9, height: 44, rx: 4 } },
  { part: "glutes.med", el: "ellipse", a: { cx: 59, cy: 158, rx: 5, ry: 8 } },
  { part: "quads.quads", el: "ellipse", a: { cx: 69, cy: 192, rx: 11, ry: 32 } },
  { part: null, el: "ellipse", a: { cx: 68, cy: 264, rx: 7, ry: 28 } }
];
const FRONT_CENTER = [{ part: "core.abs", el: "rect", a: { x: 71, y: 88, width: 18, height: 52, rx: 5 } }];

const BACK = [
  { part: "shoulders.rear", el: "ellipse", a: { cx: 57, cy: 62, rx: 10, ry: 10 } },
  { part: "shoulders.side", el: "ellipse", a: { cx: 46, cy: 67, rx: 6, ry: 11 } },
  { part: "back.lats", el: "path", a: { d: "M64 72 Q52 92 61 120 L76 114 L75 86 Z" } },
  { part: "triceps.long", el: "ellipse", a: { cx: 42, cy: 93, rx: 4.5, ry: 15 } },
  { part: "triceps.lateral", el: "ellipse", a: { cx: 49, cy: 91, rx: 4, ry: 13 } },
  { part: "forearms.grip", el: "ellipse", a: { cx: 40, cy: 130, rx: 4.5, ry: 14 } },
  { part: "forearms.brachioradialis", el: "ellipse", a: { cx: 47, cy: 125, rx: 4, ry: 10 } },
  { part: "glutes.med", el: "ellipse", a: { cx: 61, cy: 147, rx: 6, ry: 7 } },
  { part: "glutes.max", el: "ellipse", a: { cx: 70, cy: 162, rx: 11, ry: 13 } },
  { part: "hamstrings.hinge", el: "ellipse", a: { cx: 68, cy: 189, rx: 10, ry: 15 } },
  { part: "hamstrings.curl", el: "ellipse", a: { cx: 68, cy: 214, rx: 9, ry: 12 } },
  { part: "calves.gastroc", el: "ellipse", a: { cx: 67, cy: 256, rx: 8, ry: 17 } },
  { part: "calves.soleus", el: "ellipse", a: { cx: 68, cy: 279, rx: 6, ry: 9 } }
];
const BACK_CENTER = [
  { part: "back.mid", el: "rect", a: { x: 67, y: 76, width: 26, height: 26, rx: 6 } },
  { part: "back.traps", el: "path", a: { d: "M80 40 L61 57 L80 86 L99 57 Z" } },
  { part: "back.lower", el: "rect", a: { x: 70, y: 113, width: 20, height: 27, rx: 5 } }
];

const shade = (fill, selected) => {
  if (fill > 1.75) return { fill: "#fbbf24", opacity: 0.9 };
  if (fill > 0) return { fill: "#f97316", opacity: 0.2 + 0.75 * Math.min(fill, 1) };
  return { fill: "#ffffff", opacity: selected ? 0.1 : 0.05 };
};

const Region = ({ shape, fills, selectedParts, onOpenPart, mirrored }) => {
  const Tag = shape.el;
  if (!shape.part) return <Tag {...shape.a} fill="#ffffff" fillOpacity={0.05} />;
  const fill = fills[shape.part] || 0;
  const selected = selectedParts.has(shape.part);
  const { fill: color, opacity } = shade(fill, selected);
  const part = PARTS_BY_ID[shape.part];
  return (
    <Tag
      {...shape.a}
      className="cursor-pointer transition-[fill-opacity] duration-300 hover:brightness-125"
      fill={color}
      fillOpacity={opacity}
      stroke={selected && fill < 0.9 ? "#fb923c" : "none"}
      strokeDasharray={selected && fill < 0.9 ? "2 2" : undefined}
      strokeOpacity={0.7}
      strokeWidth={1}
      onClick={() => onOpenPart(shape.part)}
    >
      {mirrored ? null : (
        <title>
          {part.groupLabel}: {part.label}, {Math.round(fill * 100)}%
        </title>
      )}
    </Tag>
  );
};

const Figure = ({ shapes, center, fills, selectedParts, onOpenPart, label }) => (
  <svg className="h-auto w-full max-w-[150px]" viewBox="0 0 160 300">
    <title>{label}</title>
    <ellipse cx={80} cy={24} fill="#ffffff" fillOpacity={0.07} rx={13} ry={15} />
    <rect fill="#ffffff" fillOpacity={0.07} height={12} rx={3} width={12} x={74} y={37} />
    <rect fill="#ffffff" fillOpacity={0.04} height={92} rx={14} width={44} x={58} y={50} />
    {shapes.map((shape, index) => (
      <Region fills={fills} key={`l${index}`} onOpenPart={onOpenPart} selectedParts={selectedParts} shape={shape} />
    ))}
    <g transform="translate(160 0) scale(-1 1)">
      {shapes.map((shape, index) => (
        <Region fills={fills} key={`r${index}`} mirrored onOpenPart={onOpenPart} selectedParts={selectedParts} shape={shape} />
      ))}
    </g>
    {center.map((shape, index) => (
      <Region fills={fills} key={`c${index}`} onOpenPart={onOpenPart} selectedParts={selectedParts} shape={shape} />
    ))}
  </svg>
);

// Decorative companion to the meters (which carry the same information as text), so hidden from screen readers.
const BodyMap = ({ fills, groupIds, onOpenPart }) => {
  const selectedParts = new Set(Object.keys(PARTS_BY_ID).filter((id) => groupIds.includes(id.split(".")[0])));
  return (
    <div aria-hidden="true">
      <div className="flex items-start justify-center gap-2">
        <figure className="flex flex-1 flex-col items-center">
          <Figure center={FRONT_CENTER} fills={fills} label="Front" onOpenPart={onOpenPart} selectedParts={selectedParts} shapes={FRONT} />
          <figcaption className="mt-1 text-[0.7rem] font-semibold text-zinc-500">Front</figcaption>
        </figure>
        <figure className="flex flex-1 flex-col items-center">
          <Figure center={BACK_CENTER} fills={fills} label="Back" onOpenPart={onOpenPart} selectedParts={selectedParts} shapes={BACK} />
          <figcaption className="mt-1 text-[0.7rem] font-semibold text-zinc-500">Back</figcaption>
        </figure>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-[0.7rem] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-white/10 outline-dashed outline-1 outline-orange-400/70" /> To hit
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500/40" /> Partly
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" /> Full
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Too much
        </span>
      </div>
    </div>
  );
};

export default BodyMap;
