import dynamic from "next/dynamic";
import Loading from "../Game/Loading";

const LeaderboardComponent = dynamic(() => import("@/components/Leaderboard"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function Leaderboard() {
  return <LeaderboardComponent />;
}
