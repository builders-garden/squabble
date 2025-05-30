"use client";
import { Player } from "@/types/socket-events";
import sdk from "@farcaster/frame-sdk";
import { User } from "@prisma/client";
import { Logout } from "@solar-icons/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import SquabbleButton from "../ui/squabble-button";
import { formatAvatarUrl } from "@/lib/utils";
import useSocketUtils from "@/hooks/use-socket-utils";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Ended({
  players,
  user,
  setGameState,
  gameId,
}: {
  players: Player[];
  user: User;
  setGameState: (state: "lobby" | "loading" | "live" | "ended") => void;
  gameId: string;
}) {
  const { startGame } = useSocketUtils();
  const handleExitGame = async () => {
    await sdk.actions.close();
  };
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );

  return (
    <div className="min-h-screen bg-[#A0E9D9] flex flex-col items-center justify-between p-4">
      {/* Header */}
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[36px] mb-1"
            width={36}
            height={36}
          />
          <div
            className={`${luckiestGuy.className} text-xl text-white tracking-wider`}
          >
            SQUABBLE
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="flex flex-row items-center gap-1 text-red-600 bg-red-600/25 py-1 px-4 rounded-full text-xs">
            <p>Exit</p>
            <Logout size={12} />
          </div>
        </div>
      </div>

      {/* Game Over Title */}
      <div className="text-center">
        <h1 className={`${luckiestGuy.className} text-4xl text-white mb-2`}>
          Game Over!
        </h1>
        <p className="text-white/80">Final Scores</p>
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-md space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.fid}
            className={`flex flex-row items-center bg-[#B5E9DA] rounded-md px-4 py-3 gap-3 border-2 border-[#C8EFE3] ${
              index === 0 ? "ring-2 ring-yellow-200" : ""
            }`}
          >
            <div className="text-lg text-white font-bold w-8">{index + 1}</div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <Image
                src={formatAvatarUrl(player.avatarUrl || "")}
                alt={player.displayName || player.username || ""}
                width={48}
                height={48}
              />
            </div>
            <div className="flex flex-col items-start flex-grow">
              <div className="text-white font-medium">
                {player.displayName || player.username || ""}
              </div>
              <div className="text-white/80 text-sm">Score: {player.score || 0}</div>
            </div>
            {index === 0 && <div className="text-yellow-200 font-bold">🏆</div>}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        {/* TODO: remove after testing */}
        <SquabbleButton
          text="Play Again"
          variant="primary"
          disabled={false}
          onClick={() => startGame(user!, gameId)}
        />
        <SquabbleButton
          text="Exit Game"
          variant="primary"
          disabled={false}
          onClick={handleExitGame}
        />
      </div>
    </div>
  );
}
