const VIEWPORT_PADDING = 16;
const CARD_WIDTH = 352;
const CARD_HEIGHT = 260;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isElementVisible = (element) => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity || 1) !== 0
  );
};

export const getVisibleTutorialTarget = (targetId) => {
  const elements = [...document.querySelectorAll(`[data-tour-id="${targetId}"]`)];

  if (import.meta.env.DEV && elements.length > 1) {
    console.warn(`Duplicate tutorial target: ${targetId}`);
  }

  const visibleElement = elements.find(isElementVisible);

  if (!visibleElement && import.meta.env.DEV) {
    console.warn(`Tutorial target not found: ${targetId}`);
  }

  return visibleElement || null;
};

export const getTutorialCardPosition = (targetRect, cardSize = {}, preferredPlacement = "bottom") => {
  const width = cardSize.width || CARD_WIDTH;
  const height = cardSize.height || CARD_HEIGHT;

  if (!targetRect) {
    return {
      left: clamp((window.innerWidth - width) / 2, VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING),
      top: clamp((window.innerHeight - height) / 2, VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING)
    };
  }

  const placements = [
    preferredPlacement,
    preferredPlacement === "bottom" ? "top" : "bottom",
    preferredPlacement === "right" ? "left" : "right",
    preferredPlacement === "left" ? "right" : "left"
  ].filter(Boolean);

  const candidates = placements.map((placement) => {
    if (placement === "top") {
      return { placement, left: targetRect.left, top: targetRect.top - height - VIEWPORT_PADDING };
    }
    if (placement === "left") {
      return { placement, left: targetRect.left - width - VIEWPORT_PADDING, top: targetRect.top };
    }
    if (placement === "right") {
      return { placement, left: targetRect.right + VIEWPORT_PADDING, top: targetRect.top };
    }
    return { placement, left: targetRect.left, top: targetRect.bottom + VIEWPORT_PADDING };
  });

  const fittingCandidate = candidates.find(
    (candidate) =>
      candidate.left >= VIEWPORT_PADDING &&
      candidate.top >= VIEWPORT_PADDING &&
      candidate.left + width <= window.innerWidth - VIEWPORT_PADDING &&
      candidate.top + height <= window.innerHeight - VIEWPORT_PADDING
  );

  const selected = fittingCandidate || candidates[0];

  return {
    left: clamp(selected.left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)),
    top: clamp(selected.top, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING))
  };
};
