import { useMiniApp, MiniAppProvider } from "@/contexts/miniapp-context";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/loading-screen";

const LeaderboardComponent = dynamic(() => import("@/components/Leaderboard"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Leaderboard() {
  return <LeaderboardComponent />;
}
