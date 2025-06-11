"use client";
import { UserPlus } from "@solar-icons/react";

export default function LobbySpotAvailableCard() {
  return (
    <div
      className={`w-full h-full bg-white/5 rounded-xl flex items-center justify-center gap-2 p-2 border-2 border-white/15 border-dashed`}
    >
      <UserPlus className="text-white/50" size={20} />
      <div className={`text-lg text-white/50`}>Spot Available!</div>
    </div>
  );
}
