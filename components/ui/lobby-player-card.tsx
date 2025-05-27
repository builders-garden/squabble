import { CheckCircle, Crown, ClockCircle } from "@solar-icons/react";
import Image from "next/image";

export default function LobbyPlayerCard({
  name,
  status,
  avatar,
  isLeader,
}: any) {
  return (
    <div
      className={`bg-[#B5E9DA] rounded-xl flex items-center gap-2 p-2 ${
        status === "pending"
          ? "border-2 border-[#FFE59E]"
          : "border-2 border-[#C8EFE3]"
      }`}
    >
      <div className="relative">
        <Image
          src={avatar}
          alt={name}
          className={`w-12 h-12 rounded-full border-2 border-[#C8EFE3]`}
          width={48}
          height={48}
        />
        {isLeader && (
          <span className="absolute -top-1.5 -right-1.5 bg-yellow-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            <Crown color="black" size={20} />
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <div className={`font-bold text-white`}>{name}</div>
        <div className="flex items-center gap-1">
          {
            status === "ready" ? (
              <CheckCircle className="text-emerald-400" size={14} />
            ) : (
              <ClockCircle className="text-yellow-200" size={14} />
            )
          }
          <div
            className={`font-medium text-sm ${
              status === "pending" ? "text-yellow-200" : "text-emerald-400"
            }`}
          >
            {status === "ready" ? "Ready!" : "Waiting"}
          </div>
        </div>
      </div>
    </div>
  );
}
