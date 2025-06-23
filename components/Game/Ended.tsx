"use client";
import { GameWithParticipants } from "@/hooks/use-fetch-game";
import { cn, formatAvatarUrl } from "@/lib/utils";
import { Player } from "@/types/socket-events";
import sdk from "@farcaster/frame-sdk";
import { Logout } from "@solar-icons/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import SquabbleButton from "../ui/squabble-button";
import UserAvatar from "../ui/user-avatar";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Ended({
  players,
  game,
}: {
  players: Player[];
  game: GameWithParticipants;
}) {
  const handleExitGame = async () => {
    await sdk.actions.close();
  };

  // Determine which data source to use
  const hasGameParticipants = game?.participants?.length > 0;
  const hasPlayers = players.length > 0;

  // If no game participants but we have players, use players data
  if (!hasGameParticipants && hasPlayers) {
    const sortedPlayers = [...players].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
    const topLeaderboardScore = sortedPlayers[0]?.score || 0;
    const isDraw =
      sortedPlayers.filter((p) => p.score === topLeaderboardScore).length > 1;

    return (
      <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-between p-4">
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
          <p className="text-white/80">
            {isDraw ? "It's a Draw!" : "Final Scores"}
          </p>
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-md space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.fid}
              className={cn(
                "flex flex-row items-center bg-white/15 rounded-md px-4 py-3 gap-3 border-2 border-[#C8EFE3]",
                player.score === topLeaderboardScore
                  ? "border-2 border-yellow-200 bg-yellow-200/10"
                  : ""
              )}
            >
              <div className="text-lg text-white font-bold w-8">
                {index + 1}
              </div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <UserAvatar
                  avatarUrl={formatAvatarUrl(player.avatarUrl || "")}
                  size="md"
                />
              </div>
              <div className="flex flex-col items-start flex-grow">
                <div className="text-white font-medium">
                  {player.displayName || player.username || ""}
                </div>
                <div className="text-white/80 text-sm">
                  Score: {player.score || 0}
                </div>
              </div>
              {player.score === topLeaderboardScore && (
                <div className="text-yellow-200 font-bold">🏆</div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
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

  // If no game participants and no players, show the original "no players" message
  if (!hasGameParticipants && !hasPlayers) {
    return (
      <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-between p-4">
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
          <p className="text-white/80">No players joined the game</p>
        </div>

        {/* Empty space to maintain layout */}
        <div className="w-full max-w-md space-y-3">
          <div className="flex flex-row items-center bg-white/15 rounded-md px-4 py-3 gap-3 border-2 border-[#C8EFE3]">
            <p className="text-white/80 w-full text-center">No participants</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
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

  // Use game.participants data (original logic)
  const sortedParticipants = [...game.participants].sort(
    (a, b) => (b.points || 0) - (a.points || 0)
  );
  const topLeaderboardPoints = sortedParticipants[0]?.points || 0;
  const isDraw =
    sortedParticipants.filter((p) => p.points === topLeaderboardPoints).length >
    1;
  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-between p-4">
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
        <p className="text-white/80">
          {isDraw ? "It's a Draw!" : "Final Scores"}
        </p>
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-md space-y-3">
        {sortedParticipants.map((player, index) => (
          <div
            key={player.fid}
            className={cn(
              "flex flex-row items-center bg-white/15 rounded-md px-4 py-3 gap-3 border-2 border-[#C8EFE3]",
              player.points === topLeaderboardPoints
                ? "border-2 border-yellow-200 bg-yellow-200/10"
                : ""
            )}
          >
            <div className="text-lg text-white font-bold w-8">{index + 1}</div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <UserAvatar
                avatarUrl={formatAvatarUrl(player.user.avatarUrl || "")}
                size="md"
              />
            </div>
            <div className="flex flex-col items-start flex-grow">
              <div className="text-white font-medium">
                {player.user.displayName || player.user.username || ""}
              </div>
              <div className="text-white/80 text-sm">
                Score: {player.points || 0}
              </div>
            </div>
            {player.points === topLeaderboardPoints && (
              <div className="text-yellow-200 font-bold">🏆</div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
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
