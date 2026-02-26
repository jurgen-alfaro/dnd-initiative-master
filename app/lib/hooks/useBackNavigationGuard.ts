import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook to guard against back navigation by intercepting browser's back button.
 * Shows a confirmation dialog when user attempts to navigate back.
 *
 * @param options.enabled - Whether the guard is enabled
 * @param options.onNavigateAway - Callback to execute when user confirms navigation
 * @returns Object with confirmation dialog state and handlers
 */
export function useBackNavigationGuard(options: {
  enabled: boolean;
  onNavigateAway: () => void;
}): {
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  handleConfirmNavigation: () => void;
  handleCancelNavigation: () => void;
} {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isGuardActive = useRef(false);
  const hasAddedHistoryEntry = useRef(false);

  const handlePopState = useCallback(() => {
    if (!options.enabled || !isGuardActive.current) return;

    // Restore position in history to "undo" the back navigation
    window.history.pushState(null, "", window.location.href);

    // Show confirmation modal
    setShowConfirmation(true);
  }, [options.enabled]);

  const handleConfirmNavigation = useCallback(() => {
    // Temporarily disable guard to allow navigation
    isGuardActive.current = false;

    // Close modal
    setShowConfirmation(false);

    // Navigate away
    options.onNavigateAway();
  }, [options.onNavigateAway]);

  const handleCancelNavigation = useCallback(() => {
    // Just close the modal, keep guard active
    setShowConfirmation(false);
  }, []);

  useEffect(() => {
    if (!options.enabled) {
      isGuardActive.current = false;
      return;
    }

    // Add extra history entry on mount to prevent immediate exit on first back press
    if (!hasAddedHistoryEntry.current) {
      window.history.pushState(null, "", window.location.href);
      hasAddedHistoryEntry.current = true;
    }

    // Activate guard
    isGuardActive.current = true;

    // Add popstate listener
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handlePopState);
      isGuardActive.current = false;
    };
  }, [options.enabled, handlePopState]);

  return {
    showConfirmation,
    setShowConfirmation,
    handleConfirmNavigation,
    handleCancelNavigation,
  };
}
