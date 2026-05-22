import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tutorialService } from "../../services/tutorialService.js";
import { getTutorialCardPosition, getVisibleTutorialTarget } from "../../utils/tutorialPositioning.js";
import TutorialCard from "./TutorialCard.jsx";
import TutorialHighlight from "./TutorialHighlight.jsx";
import TutorialOverlay from "./TutorialOverlay.jsx";

const skippedIsRecent = (progress) => {
  if (!progress?.skippedAt) return false;
  const skippedAt = new Date(progress.skippedAt).getTime();
  return Date.now() - skippedAt < 7 * 24 * 60 * 60 * 1000;
};

const GuidedTutorial = ({ pageKey, steps = [], active, autoStart = false, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const currentStep = steps[stepIndex];
  const targetRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafRef = useRef(null);
  const retryTimerRef = useRef(null);

  const measureTarget = useCallback(() => {
    if (!currentStep) return false;
    const element = getVisibleTutorialTarget(currentStep.target);

    if (!element) {
      targetRef.current = null;
      setRect(null);
      setTargetMissing(true);
      return false;
    }

    targetRef.current = element;
    setTargetMissing(false);
    setRect(element.getBoundingClientRect());
    return true;
  }, [currentStep]);

  const scheduleMeasure = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      if (targetRef.current) {
        setRect(targetRef.current.getBoundingClientRect());
      } else {
        measureTarget();
      }
    });
  }, [measureTarget]);

  const resolveStepTarget = useCallback(() => {
    if (!currentStep) return;
    window.clearTimeout(retryTimerRef.current);
    setTargetMissing(false);

    const startedAt = Date.now();
    const attempt = () => {
      const element = getVisibleTutorialTarget(currentStep.target);

      if (element) {
        targetRef.current = element;
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        setRect(element.getBoundingClientRect());
        setTargetMissing(false);

        window.setTimeout(scheduleMeasure, 250);
        window.setTimeout(scheduleMeasure, 500);

        resizeObserverRef.current?.disconnect();
        if (window.ResizeObserver) {
          resizeObserverRef.current = new ResizeObserver(scheduleMeasure);
          resizeObserverRef.current.observe(element);
        }
        return;
      }

      if (Date.now() - startedAt < 1000) {
        retryTimerRef.current = window.setTimeout(attempt, 80);
      } else {
        targetRef.current = null;
        setRect(null);
        setTargetMissing(true);
      }
    };

    retryTimerRef.current = window.setTimeout(attempt, 120);
  }, [currentStep, scheduleMeasure]);

  useEffect(() => {
    if (!pageKey || !steps.length) return;
    tutorialService
      .getPageTutorialProgress(pageKey)
      .then((data) => {
        setProgress(data.progress);
        if (autoStart && !data.progress?.completed && !skippedIsRecent(data.progress)) {
          window.setTimeout(() => {
            setRunning(true);
            setStepIndex(data.progress?.lastStep || 0);
          }, 400);
        }
      })
      .catch(() => setProgress(null));
  }, [autoStart, pageKey, steps.length]);

  useEffect(() => {
    if (active) {
      setRunning(true);
      setStepIndex(0);
      setDontShowAgain(false);
    }
  }, [active]);

  useEffect(() => {
    if (!running) return;
    resolveStepTarget();
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("scroll", scheduleMeasure);
    return () => {
      window.clearTimeout(retryTimerRef.current);
      window.cancelAnimationFrame(rafRef.current);
      resizeObserverRef.current?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("scroll", scheduleMeasure);
    };
  }, [resolveStepTarget, running, scheduleMeasure]);

  useEffect(() => {
    if (!running) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleSkip();
      if (event.key === "Enter") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const updateProgress = async (payload) => {
    try {
      const data = await tutorialService.updateTutorialProgress(pageKey, payload);
      setProgress(data.progress);
    } catch (_error) {
      // The tutorial should never block page usage if progress saving fails.
    }
  };

  const close = () => {
    setRunning(false);
    onClose?.();
  };

  const handleSkip = () => {
    updateProgress({ skipped: true, lastStep: stepIndex });
    close();
  };

  const handleFinish = () => {
    updateProgress({ completed: true, skipped: false, lastStep: steps.length - 1 });
    close();
  };

  const handleNext = () => {
    if (dontShowAgain) {
      handleFinish();
      return;
    }
    if (stepIndex >= steps.length - 1) {
      handleFinish();
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    updateProgress({ lastStep: nextIndex });
  };

  const handleBack = () => {
    const previousIndex = Math.max(0, stepIndex - 1);
    setStepIndex(previousIndex);
    updateProgress({ lastStep: previousIndex });
  };

  const cardPosition = useMemo(
    () => (window.innerWidth < 768 ? null : getTutorialCardPosition(rect, undefined, currentStep?.placement)),
    [currentStep?.placement, rect]
  );

  if (!running || !steps.length || !currentStep) return null;

  return (
    <AnimatePresence>
      <TutorialOverlay />
      <TutorialHighlight rect={rect} />
      <TutorialCard
        dontShowAgain={dontShowAgain}
        position={cardPosition}
        step={currentStep}
        stepIndex={stepIndex}
        targetMissing={targetMissing}
        totalSteps={steps.length}
        onBack={handleBack}
        onDontShowAgainChange={setDontShowAgain}
        onFinish={handleFinish}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </AnimatePresence>
  );
};

export default GuidedTutorial;
