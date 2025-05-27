import { ClockCircle } from "@solar-icons/react";
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

const players = [
  {
    name: "limone",
    status: "ready",
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/05f5a8aa-48ee-48af-d618-c420091f3200/original",
    isLeader: true,
  },
  {
    name: "Dan Romero",
    status: "ready",
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bc698287-5adc-4cc5-a503-de16963ed900/original",
    isLeader: false,
  },
  {
    name: "jesse.base.eth",
    status: "pending",
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1013b0f6-1bf4-4f4e-15fb-34be06fede00/original",
    isLeader: false,
  },
  {
    name: "albert",
    status: "pending",
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/7a4437ba-e141-4b1f-840d-53758f27f700/rectcrop3",
    isLeader: false,
  },
];

export default function Lobby({
  setGameState,
}: {
  setGameState: (state: "lobby" | "live") => void;
}) {
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
          <Chip text="4/6 Players" variant="info" />
          <Chip text="$1 Stake" variant="info" />
          <Chip
            text="2 Pending stakes"
            icon={<ClockCircle size={14} />}
            variant="warning"
          />
        </div>
        <div className="font-medium text-xl text-white">Players in Lobby</div>
        <div className="grid grid-cols-2 grid-rows-3 gap-4">
          {players.map((p, i) => (
            <LobbyPlayerCard key={i} {...p} />
          ))}
          {[...Array(2)].map((_, i) => (
            <LobbySpotAvailableCard key={i} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center w-full">
        <div className="text-white/75">Waiting for all players to join...</div>
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
