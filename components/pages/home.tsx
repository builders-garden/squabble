import dynamic from "next/dynamic";
import Loading from "@/components/Game/Loading";

const HomeComponent = dynamic(() => import("@/components/Home"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function Home() {
  return <HomeComponent />;
}
