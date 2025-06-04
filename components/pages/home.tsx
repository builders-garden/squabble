import { LoadingScreen } from "@/components/ui/loading-screen";
import dynamic from "next/dynamic";

const HomeComponent = dynamic(() => import("@/components/Home"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  return <HomeComponent />;
}
