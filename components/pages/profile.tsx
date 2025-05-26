import { useMiniApp, MiniAppProvider } from "@/contexts/miniapp-context";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ProfileComponent = dynamic(() => import("@/components/Profile"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Profile() {
  return <ProfileComponent />;
}
