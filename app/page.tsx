// import Image from "next/image";
// import InitiativeList from "./components/initiative-list";
// import { getPartyByCode } from "@/app/server/actions";
import HomePage from "./pages/HomePage";

export default async function Home() {
  // const party = await getPartyByCode("ABCDEF");

  return (
    <main className="relative min-h-screen flex justify-center items-center w-full">
      <HomePage />
    </main>
  );
}
