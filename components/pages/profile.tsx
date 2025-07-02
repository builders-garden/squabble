import dynamic from "next/dynamic";
import Loading from "../Game/Loading";

const ProfileComponent = dynamic(() => import("@/components/Profile"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function Profile() {
  return <ProfileComponent />;
}
