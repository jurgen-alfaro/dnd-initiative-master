"use client";
import { useEffect, useState } from "react";
import { useRecentParty } from "@/app/lib/hooks/useRecentParty";
import { RecentPartyCard } from "@/app/components/RecentPartyCard";
import type { DmParty, RecentPartyData } from "@/app/lib/types";
import JoinPartyDialog from "../components/JoinPartyDialog";
import CreatePartyDialog from "../components/CreatePartyDialog";
import SelectPartyDialog from "../components/SelectPartyDialog";
import RecoverDmDialog from "../components/RecoverDmDialog";
import SetRecoveryWordDialog from "../components/SetRecoveryWordDialog";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import { readRecoveryCode } from "@/app/lib/dm-token";
import { getPartiesForDevice } from "@/app/server/actions";

const HomePage = () => {
  // Recent party management
  const { getRecentParty, clearRecentParty } = useRecentParty();
  const [recentParty, setRecentParty] = useState<RecentPartyData | null>(null);

  // DM identity: parties owned by this device + stored recovery code
  const [dmParties, setDmParties] = useState<DmParty[]>([]);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [isSelectPartyOpen, setIsSelectPartyOpen] = useState(false);

  // Load client-only state on mount. localStorage reads run in the async
  // callbacks (not synchronously in the effect) and after mount, keeping them
  // hydration-safe.
  useEffect(() => {
    getPartiesForDevice(getOrCreateDeviceId())
      .then(setDmParties)
      .catch(() => setDmParties([]))
      .finally(() => {
        setRecentParty(getRecentParty());
        setRecoveryCode(readRecoveryCode());
      });
  }, [getRecentParty]);

  const handleDismiss = () => {
    clearRecentParty();
    setRecentParty(null);
  };

  const handleRecovered = (parties: DmParty[]) => {
    setDmParties(parties);
    setRecoveryCode(readRecoveryCode());
    if (parties.length > 0) setIsSelectPartyOpen(true);
  };

  return (
    <section className="flex w-full flex-col items-center px-6">
      {/* Logo */}
      <div
        aria-hidden="true"
        className="mb-6 flex size-24 items-center justify-center rounded-full border border-dnd-gold/30 bg-linear-to-b from-dnd-gold/15 to-transparent text-5xl shadow-[0_0_35px_-8px_var(--dnd-gold)]"
      >
        🐉
      </div>

      {/* Title */}
      <h1 className="mb-8 text-center font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        D&D Initiative
        <br />
        <span className="text-dnd-gold">Tracker</span>
      </h1>

      {recentParty && (
        <div className="mb-6 w-full max-w-sm">
          <RecentPartyCard partyData={recentParty} onDismiss={handleDismiss} />
        </div>
      )}

      {/* Primary CTAs */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <CreatePartyDialog />
        <JoinPartyDialog />
        {dmParties.length > 0 && (
          <SelectPartyDialog
            parties={dmParties}
            triggerVariant="ghost"
            triggerSize="sm"
            open={isSelectPartyOpen}
            onOpenChange={setIsSelectPartyOpen}
          />
        )}
      </div>

      {/* Divider */}
      <div className="my-6 h-px w-full max-w-sm bg-border/60" />

      {/* Secondary actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <RecoverDmDialog onRecovered={handleRecovered} />
        {recoveryCode && (
          <SetRecoveryWordDialog
            currentCode={recoveryCode}
            onChanged={setRecoveryCode}
          />
        )}
      </div>
    </section>
  );
};

export default HomePage;
