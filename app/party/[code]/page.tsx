import { notFound } from "next/navigation";
import { getPartyWithCombatants } from "@/app/server/actions";
import PartyPage from "@/app/pages/PartyPage";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function PartyRoute({ params }: Props) {
  const { code } = await params;
  const party = await getPartyWithCombatants(code.toUpperCase());

  if (!party) {
    notFound();
  }

  return <PartyPage party={party} />;
}
