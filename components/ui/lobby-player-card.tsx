"use client";

import { CheckCircleIcon, ClockIcon } from "lucide-react";
import { formatAvatarUrl } from "@/lib/utils";
import { Player } from "@/types/socket/player";
import UserAvatar from "./user-avatar";

export default function LobbyPlayerCard({
  player,
  status,
  isCurrentPlayer,
}: {
  player: Player;
  status: "pending" | "ready";
  isCurrentPlayer: boolean;
}) {
  return (
    <div
      className={`w-full h-full rounded-xl flex items-center gap-1 p-2 ${
        isCurrentPlayer
          ? "border-2 border-blue-300 bg-blue-300/15"
          : "border-2 border-[#C8EFE3] bg-white/15"
      }`}>
      <div className="relative">
        <UserAvatar
          avatarUrl={formatAvatarUrl(player.avatarUrl!)}
          size="md"
          className={`border-2 ${
            isCurrentPlayer ? "border-blue-300" : "border-[#C8EFE3]"
          }`}
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <div
          className={`font-medium text-white text-xs truncate max-w-[120px]`}>
          {player.displayName || player.username || ""}
        </div>
        <div className="flex items-center gap-1">
          {status === "ready" ? (
            <CheckCircleIcon className="text-emerald-400" size={14} />
          ) : (
            <ClockIcon className="text-yellow-200" size={14} />
          )}
          <div
            className={`font-medium text-xs ${
              status === "pending" ? "text-yellow-200" : "text-emerald-400"
            }`}>
            {status === "ready" ? "Ready!" : "Not ready"}
          </div>
        </div>
      </div>
    </div>
  );
}
