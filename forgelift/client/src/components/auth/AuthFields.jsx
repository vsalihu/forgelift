import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

const inputBase =
  "h-12 w-full rounded-2xl border bg-white/[0.03] px-4 text-base text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-zinc-500 focus:bg-white/[0.05]";
const inputOk =
  "border-white/10 hover:border-white/20 focus:border-forge-ember/70 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.14),0_0_32px_-8px_rgba(249,115,22,0.55)]";
const inputBad = "border-red-400/60 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.15)]";

export const inputClass = (invalid, extra = "") => `${inputBase} ${invalid ? inputBad : inputOk} ${extra}`;

// Label above, input, then either the error or a hint below.
export const AuthField = forwardRef(({ id, label, error, hint, leading, trailing, className = "", ...inputProps }, ref) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-zinc-200" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {leading ? <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500">{leading}</div> : null}
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={inputClass(Boolean(error), `${leading ? "pl-10" : ""} ${trailing ? "pr-12" : ""}`)}
          id={id}
          ref={ref}
          {...inputProps}
        />
        {trailing ? <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div> : null}
      </div>
      <FieldMessage error={error} hint={hint} id={id} />
    </div>
  );
});
AuthField.displayName = "AuthField";

export const FieldMessage = ({ id, error, hint }) => {
  if (error) {
    return (
      <p className="mt-2 text-sm text-red-300" id={`${id}-error`} role="alert">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p className="mt-2 text-sm leading-6 text-zinc-500" id={`${id}-hint`}>
        {hint}
      </p>
    );
  }
  return null;
};

export const PasswordField = forwardRef(({ id, label = "Password", error, hint, children, ...inputProps }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <AuthField
        error={error}
        hint={hint}
        id={id}
        label={label}
        ref={ref}
        trailing={
          <button
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
          </button>
        }
        type={visible ? "text" : "password"}
        {...inputProps}
      />
      {children}
    </div>
  );
});
PasswordField.displayName = "PasswordField";

export const AuthSubmit = ({ children, busy, busyLabel, className = "", ...props }) => (
  <button
    className={`group relative inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-7 text-base font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_12px_40px_-10px_rgba(249,115,22,0.85)] transition-[transform,box-shadow,opacity] duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_16px_60px_-8px_rgba(249,115,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    disabled={busy || props.disabled}
    {...props}
  >
    {busy ? busyLabel : children}
  </button>
);

export const AuthBack = ({ children, ...props }) => (
  <button
    className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 text-base font-bold text-zinc-100 transition-colors hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98]"
    type="button"
    {...props}
  >
    {children}
  </button>
);

export const FormAlert = ({ children }) =>
  children ? (
    <div aria-live="polite" className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
      {children}
    </div>
  ) : null;

export const RememberMe = ({ checked, onChange }) => (
  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-zinc-300">
    <input checked={checked} className="peer sr-only" type="checkbox" onChange={(event) => onChange(event.target.checked)} />
    <span
      aria-hidden="true"
      className="flex h-5 w-5 items-center justify-center rounded-md border border-white/20 bg-white/[0.03] transition-colors peer-checked:border-forge-ember peer-checked:bg-forge-ember peer-focus-visible:ring-2 peer-focus-visible:ring-amber-200 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
    >
      <svg className="h-3.5 w-3.5 text-[#160a02]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
    Keep me logged in on this device
  </label>
);
