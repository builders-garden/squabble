import dynamic from "next/dynamic";
import Loading from "@/components/Game/Loading";

const GameComponent = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function Game({ params }: { params: { id: string } }) {
  return <GameComponent id={params.id} />;
}
