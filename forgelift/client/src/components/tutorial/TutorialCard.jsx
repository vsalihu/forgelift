import { motion } from "framer-motion";
import Button from "../Button.jsx";

const TutorialCard = ({
  step,
  stepIndex,
  totalSteps,
  position,
  targetMissing,
  dontShowAgain,
  onDontShowAgainChange,
  onBack,
  onNext,
  onSkip,
  onFinish
}) => {
  const isLast = stepIndex === totalSteps - 1;
  const style = position
    ? {
        left: `${position.left}px`,
        top: `${position.top}px`,
        bottom: "auto"
      }
    : {};

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[80] max-h-[50vh] overflow-y-auto rounded-2xl border border-white/10 bg-forge-panel p-4 shadow-2xl md:bottom-auto md:left-auto md:right-auto md:max-h-[calc(100vh-2rem)] md:w-[22rem]"
      initial={{ opacity: 0, y: 12 }}
      key={`${step.target}-${stepIndex}`}
      style={window.innerWidth >= 640 ? style : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-xs font-black text-orange-100">
          {stepIndex + 1}/{totalSteps}
        </span>
        <button className="text-xs font-bold text-slate-400 hover:text-white" type="button" onClick={onSkip}>
          Skip
        </button>
      </div>
      <h2 className="text-lg font-black text-white">{targetMissing ? step.fallbackTitle || step.title : step.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {targetMissing
          ? step.fallbackContent || "This section is not available on this page yet."
          : step.content}
      </p>
      {step.actionHint ? <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-slate-300">{step.actionHint}</p> : null}
      <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <input
          checked={dontShowAgain}
          className="h-4 w-4 accent-forge-ember"
          type="checkbox"
          onChange={(event) => onDontShowAgainChange(event.target.checked)}
        />
        Don&apos;t show again
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button disabled={stepIndex === 0} type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        {isLast ? (
          <Button type="button" onClick={onFinish}>
            Finish
          </Button>
        ) : (
          <Button type="button" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default TutorialCard;
