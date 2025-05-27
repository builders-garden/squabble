import { useMiniApp, MiniAppProvider } from "@/contexts/miniapp-context";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/loading-screen";

const GameComponent = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Game({
  params,
}: {
  params: { id: string };
}) {
  return <GameComponent id={params.id} />;
}
