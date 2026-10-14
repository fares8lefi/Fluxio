/**
 * Shared motion presets — one rhythm for the whole app.
 *
 * Fluxio is a daily-use business tool, so motion is "mixed":
 * - subtle everywhere (150–250 ms, no overshoot) so it never slows work down;
 * - expressive only at key moments (dashboard opening, confirmations, empty
 *   states), where a little character helps the user notice what happened.
 *
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user">
 * in main.jsx: transforms are dropped, opacity fades remain.
 */

export const EASE_OUT = [0.16, 1, 0.3, 1]; // fast start, gentle landing
export const EASE_IN_OUT = [0.65, 0, 0.35, 1];

export const DURATION = { fast: 0.15, base: 0.25, slow: 0.4 };

/** Snappy spring with no visible bounce — modals, popovers */
export const SPRING_SOFT = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };
/** Springier — reserved for key moments (success, celebration) */
export const SPRING_POP = { type: 'spring', stiffness: 520, damping: 22 };

/** Page content entering after navigation */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/** Parent that reveals its children one after another (dashboard grids) */
export const staggerContainer = (stagger = 0.06, delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Child of a stagger container */
export const fadeUpItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
};
