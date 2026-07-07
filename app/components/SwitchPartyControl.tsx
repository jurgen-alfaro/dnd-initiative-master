"use client";

import { useEffect, useState } from "react";
import type { DmParty } from "@/app/lib/types";
import { getPartiesForDevice } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import SelectPartyDialog from "./SelectPartyDialog";

interface SwitchPartyControlProps {
  currentPartyCode: string;
  isDm: boolean;
}

/**
 * DM-only shortcut to jump to another of this device's parties without going
 * back to the home screen. Renders nothing unless the viewer is the DM and owns
 * at least one party other than the current one.
 */
export default function SwitchPartyControl({
  currentPartyCode,
  isDm,
}: SwitchPartyControlProps) {
  const [parties, setParties] = useState<DmParty[]>([]);

  useEffect(() => {
    if (!isDm) return;
    let cancelled = false;
    getPartiesForDevice(getOrCreateDeviceId())
      .then((all) => {
        if (!cancelled) setParties(all);
      })
      .catch(() => {
        if (!cancelled) setParties([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isDm]);

  // Gate on isDm here (rather than resetting state) so a non-DM never sees the
  // control even if parties were fetched during a prior DM session.
  const otherParties = isDm
    ? parties.filter((p) => p.code !== currentPartyCode)
    : [];
  if (otherParties.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mb-4 flex justify-end">
      <SelectPartyDialog
        parties={otherParties}
        triggerLabel="Switch party"
        triggerSize="sm"
      />
    </div>
  );
}
