import { useEffect, useState } from "react";

/**
 * Snapshot of the browser's visual viewport (the area actually visible to the
 * user, which shrinks when the on-screen keyboard opens).
 */
export type VisualViewportState = {
  /** Height of the visual viewport in CSS pixels. */
  height: number;
  /** Vertical offset of the visual viewport within the layout viewport. */
  offsetTop: number;
  /** True when the on-screen keyboard is (very likely) covering the layout viewport. */
  isKeyboardOpen: boolean;
};

// Minimum gap (px) between the layout viewport and the visual viewport before
// we treat the shrinkage as an open on-screen keyboard rather than browser chrome.
const KEYBOARD_THRESHOLD_PX = 100;

/**
 * Tracks `window.visualViewport` so components can react to the on-screen
 * keyboard. Needed on iOS Safari, where `interactive-widget=resizes-content`
 * is not supported and `position: fixed` elements stay pinned to the full
 * layout viewport (hidden behind the keyboard).
 *
 * Returns `null` during SSR or on browsers without the VisualViewport API.
 */
export function useVisualViewport(): VisualViewportState | null {
  const [state, setState] = useState<VisualViewportState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setState({
          height: viewport.height,
          offsetTop: viewport.offsetTop,
          isKeyboardOpen:
            window.innerHeight - viewport.height > KEYBOARD_THRESHOLD_PX,
        });
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
