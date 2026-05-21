const variantClasses = {
  hero: "mt-4 text-sm uppercase tracking-[0.25em] text-amber-300/80",
  subtle: "mt-4 text-xs tracking-wide text-slate-500",
  footer: "text-center text-xs tracking-wide text-slate-500",
  loader: "mt-3 text-xs uppercase tracking-[0.25em] text-slate-500"
};

const BrandSignature = ({ variant = "subtle", className = "" }) => (
  <p className={`${variantClasses[variant] || variantClasses.subtle} ${className}`}>Forged by SALIHU</p>
);

export default BrandSignature;
