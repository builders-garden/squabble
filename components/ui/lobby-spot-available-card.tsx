import { UserPlus } from "@solar-icons/react";

export default function LobbySpotAvailableCard() {
  return (
    <div
      className={`bg-[#B5E9DA] rounded-xl flex items-center justify-center gap-2 p-2 border-2 border-[#C8EFE3] border-dashed`}
    >
      <UserPlus className="text-white/50" size={20} />
      <div className={`text-lg text-white/50`}>Spot Available!</div>
    </div>
  );
}
