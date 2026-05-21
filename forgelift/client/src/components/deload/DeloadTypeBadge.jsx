const labels = {
  weight_deload: "Weight Deload",
  volume_deload: "Volume Deload",
  intensity_deload: "Intensity Deload",
  rest_deload: "Rest Deload",
  technique_reset: "Technique Reset",
  full_body_deload: "Full Body Deload"
};

const DeloadTypeBadge = ({ type }) => (
  <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-xs font-bold text-orange-200">
    {labels[type] || type?.replaceAll("_", " ") || "Deload"}
  </span>
);

export default DeloadTypeBadge;
