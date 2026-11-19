// ============================================================================
// DEVICE PROFILE
// One-time capability probe used to scale the heavy visual effects down on
// phones / low-end hardware. Everything here is read once at module load, so
// the cost is a couple of matchMedia calls.
// ============================================================================

const hasWindow = typeof window !== 'undefined';

const coarsePointer =
  hasWindow && typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;

const narrowViewport = hasWindow ? window.innerWidth < 900 : false;

const cores =
  typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 4;

const memory =
  typeof navigator !== 'undefined' && navigator.deviceMemory
    ? navigator.deviceMemory
    : 4;

/** True on phones/tablets (touch + narrow screen). */
export const isTouchDevice = coarsePointer && narrowViewport;

/** True when the device should get the "lite" version of the effects. */
export const isLowPower = coarsePointer && (narrowViewport || cores <= 4 || memory <= 4);

/** Respect the OS "reduce motion" setting. */
export const prefersReducedMotion =
  hasWindow && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

/**
 * Cap for renderer.setPixelRatio(). Rendering at 3x on a 1080p phone means
 * ~2.5x more pixels than a laptop for the same CSS size.
 */
export const maxPixelRatio = () =>
  Math.min((hasWindow && window.devicePixelRatio) || 1, isLowPower ? 1.5 : 2);

/**
 * Observe an element and call `onChange(inView)` whenever it enters or leaves
 * the viewport. Used to fully stop canvases / CSS animations that are scrolled
 * away instead of letting them burn CPU in the background.
 *
 * Returns a cleanup function (safe to call even if not yet supported).
 */
export function observeVisibility(element, onChange, options) {
  if (!element || typeof IntersectionObserver === 'undefined') {
    // No IO support: assume it is visible so nothing appears broken.
    onChange(true);
    return () => {};
  }

  const observer = new IntersectionObserver(
    ([entry]) => onChange(entry.isIntersecting && entry.intersectionRatio > 0),
    { rootMargin: '120px 0px', threshold: 0, ...options }
  );

  observer.observe(element);
  return () => observer.disconnect();
}
