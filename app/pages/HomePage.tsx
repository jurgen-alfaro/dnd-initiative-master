"use client";
import { useEffect, useState } from "react";
import { useRecentParty } from "@/app/lib/hooks/useRecentParty";
import { RecentPartyCard } from "@/app/components/RecentPartyCard";
import type { DmParty, RecentPartyData } from "@/app/lib/types";
import JoinPartyDialog from "../components/JoinPartyDialog";
import CreatePartyDialog from "../components/CreatePartyDialog";
import SelectPartyDialog from "../components/SelectPartyDialog";
import RecoverDmDialog from "../components/RecoverDmDialog";
import RecoveryCodeDialog from "../components/RecoveryCodeDialog";
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
  };

  return (
    <section className="relative w-full flex flex-col items-center gap-4 ">
      <h1 className="relative z-10 text-center text-5xl font-extrabold tracking-tight mb-8">
        D&D Initiative Tracker
      </h1>
      {recentParty && (
        <div className="relative z-10 w-full max-w-2xl px-4">
          <RecentPartyCard partyData={recentParty} onDismiss={handleDismiss} />
        </div>
      )}
      <div className="relative z-10 flex flex-wrap gap-4 justify-center">
        <CreatePartyDialog />
        <JoinPartyDialog />
        {dmParties.length > 0 && <SelectPartyDialog parties={dmParties} />}
      </div>
      <div className="relative z-10 flex flex-wrap gap-2 justify-center">
        <RecoverDmDialog onRecovered={handleRecovered} />
        {recoveryCode && <RecoveryCodeDialog recoveryCode={recoveryCode} />}
      </div>
      <div
        aria-hidden="true"
        className="absolute text-[150px] bottom-5 opacity-20"
      >
        🐉
      </div>
    </section>
  );
};

export default HomePage;
