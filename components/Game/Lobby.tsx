import { Player } from "@/types/socket-events";
import { CheckCircle, ClockCircle } from "@solar-icons/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import Chip from "../ui/chip";
import LobbyPlayerCard from "../ui/lobby-player-card";
import LobbySpotAvailableCard from "../ui/lobby-spot-available-card";
import SquabbleButton from "../ui/squabble-button";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Lobby({
  setGameState,
  gameLeaderFid,
  players,
}: {
  setGameState: (state: "lobby" | "live") => void;
  gameLeaderFid: number;
  players: Player[];
}) {
  const pendingStakes = players.filter((p) => !p.ready).length;
  return (
    <div className="min-h-screen bg-[#A0E9D9] flex flex-col items-center justify-between p-4">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Squabble Logo"
          className="w-[120px]"
          width={120}
          height={120}
        />
        <div
          className={`${luckiestGuy.className} text-4xl text-white tracking-wider`}
        >
          SQUABBLE
        </div>
        <div className="text-xl text-white font-medium">
          Outspell your friends, in real time.
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center">
        <div className="flex gap-2">
          <Chip text={`${players.length}/6 Players`} variant="info" />
          {/* TODO: add from game data */}
          <Chip text="$1 Stake" variant="info" />
          {pendingStakes > 0 ? (
            <Chip
              text={`${pendingStakes} Pending stakes`}
              icon={<ClockCircle size={14} />}
              variant="warning"
            />
          ) : players?.length > 0 ? (
            <Chip
              text="Ready"
              icon={<CheckCircle size={14} />}
              variant="success"
            />
          ) : null}
        </div>
        <div className="font-medium text-xl text-white">Players in Lobby</div>
        <div className="grid grid-cols-2 grid-rows-3 gap-4">
          {players.map((p, i) => (
            <LobbyPlayerCard
              key={i}
              player={p}
              status={p.ready ? "ready" : "pending"}
              isLeader={p.fid?.toString() === gameLeaderFid?.toString()}
            />
          ))}
          {[...Array(6 - players.length)].map((_, i) => (
            <LobbySpotAvailableCard key={i} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center w-full">
        <div className="text-white/75">Waiting for players to join...</div>
        <SquabbleButton
          text="Start Game"
          variant="primary"
          disabled={false}
          onClick={() => {
            setGameState("live");
          }}
        />
      </div>
    </div>
  );
}
