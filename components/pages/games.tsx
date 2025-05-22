import { useMiniApp, MiniAppProvider } from "@/contexts/miniapp-context";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/loading-screen";

const GamesComponent = dynamic(() => import("@/components/Games"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Games() {
  return <GamesComponent />;
}
