import { useCallback } from "react";
import type { RecentPartyData } from "@/app/lib/types";

const RECENT_PARTY_KEY = "dnd-recent-party";

/**
 * Hook for managing recent party data in localStorage.
 * Provides type-safe operations with error handling and validation.
 */
export function useRecentParty() {
  /**
   * Retrieves recent party data from localStorage with validation.
   * Returns null if data is invalid or doesn't exist.
   */
  const getRecentParty = useCallback((): RecentPartyData | null => {
    // SSR safety check
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = localStorage.getItem(RECENT_PARTY_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Validate required fields exist
      if (!parsed.code || !parsed.name || !parsed.lastAccessedAt) {
        console.warn("Invalid recent party data: missing required fields");
        localStorage.removeItem(RECENT_PARTY_KEY);
        return null;
      }

      // Validate code format (6 uppercase alphanumeric)
      if (!/^[A-Z0-9]{6}$/.test(parsed.code)) {
        console.warn("Invalid recent party data: invalid code format");
        localStorage.removeItem(RECENT_PARTY_KEY);
        return null;
      }

      return parsed as RecentPartyData;
    } catch (error) {
      console.error("Error reading recent party from localStorage:", error);
      // Clear corrupted data
      try {
        localStorage.removeItem(RECENT_PARTY_KEY);
      } catch (clearError) {
        // Silently fail if we can't clear
      }
      return null;
    }
  }, []);

  /**
   * Saves party data to localStorage with current timestamp.
   */
  const saveRecentParty = useCallback((code: string, name: string) => {
    // SSR safety check
    if (typeof window === "undefined") {
      return;
    }

    try {
      const data: RecentPartyData = {
        code,
        name,
        lastAccessedAt: new Date().toISOString(),
      };

      localStorage.setItem(RECENT_PARTY_KEY, JSON.stringify(data));
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.error("localStorage quota exceeded");
      } else if (
        error instanceof DOMException &&
        error.name === "SecurityError"
      ) {
        console.error("localStorage access denied (SecurityError)");
      } else {
        console.error("Error saving recent party to localStorage:", error);
      }
      // Silently fail - non-critical feature
    }
  }, []);

  /**
   * Removes recent party data from localStorage.
   */
  const clearRecentParty = useCallback(() => {
    // SSR safety check
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(RECENT_PARTY_KEY);
    } catch (error) {
      console.error("Error clearing recent party from localStorage:", error);
      // Silently fail
    }
  }, []);

  /**
   * Updates only the lastAccessedAt timestamp for existing party data.
   * If party code doesn't match stored data, does nothing.
   */
  const updateLastAccessed = useCallback(
    (code: string) => {
      // SSR safety check
      if (typeof window === "undefined") {
        return;
      }

      try {
        const current = getRecentParty();
        if (current && current.code === code) {
          // Only update if the code matches current stored party
          const updated: RecentPartyData = {
            ...current,
            lastAccessedAt: new Date().toISOString(),
          };
          localStorage.setItem(RECENT_PARTY_KEY, JSON.stringify(updated));
        }
      } catch (error) {
        console.error("Error updating last accessed timestamp:", error);
        // Silently fail
      }
    },
    [getRecentParty],
  );

  return {
    getRecentParty,
    saveRecentParty,
    clearRecentParty,
    updateLastAccessed,
  };
}
