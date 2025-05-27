import { Logout, Shuffle } from "@solar-icons/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import SquabbleButton from "../ui/squabble-button";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

const players = [
  {
    name: "limone",
    score: 140,
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/05f5a8aa-48ee-48af-d618-c420091f3200/original",
  },
  {
    name: "Dan Romero",
    score: 122,
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bc698287-5adc-4cc5-a503-de16963ed900/original",
  },
  {
    name: "Jesse Pollak",
    score: 120,
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1013b0f6-1bf4-4f4e-15fb-34be06fede00/original",
  },
  {
    name: "albert",
    score: 78,
    avatar:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/7a4437ba-e141-4b1f-840d-53758f27f700/rectcrop3",
  },
];

const boardWord = ["B", "A", "L", "L"];
const letters = [
  { letter: "B", value: 2 },
  { letter: "C", value: 2 },
  { letter: "F", value: 4 },
  { letter: "X", value: 8 },
  { letter: "A", value: 1 },
  { letter: "O", value: 1 },
  { letter: "T", value: 3 },
];

export default function Live({
  setGameState,
}: {
  setGameState: (state: "lobby" | "live") => void;
}) {
  return (
    <div className="min-h-screen bg-[#A0E9D9] flex flex-col items-center justify-between p-4">
      {/* Header */}
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-row items-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[40px] mb-2"
            width={40}
            height={40}
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

          <p className="text-black bg-white py-1 px-4 rounded-full text-xs">
            5:00
          </p>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full max-w-3xl mx-auto">
        {players.map((p, i) => (
          <div
            key={p.name}
            className={`flex flex-row items-center bg-[#B5E9DA] rounded-xl px-1 py-1 gap-1 min-w-[70px] border-2 border-[#C8EFE3] ${
              i === 0 ? "ring-2 ring-yellow-200" : ""
            }`}
          >
            <div className="text-xs text-white rounded-full font-bold">
              {i + 1}
            </div>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <Image src={p.avatar} alt={p.name} width={32} height={32} />
            </div>
            <div className="flex flex-col items-start">
              <div className="text-xs text-white">{p.name}</div>
              <div className="text-xs text-white font-bold">{p.score}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Game Board */}
      <div className="bg-[#B5E9DA] rounded-xl p-2 flex flex-col items-center">
        <div className="gap-0 grid grid-cols-10 grid-rows-10 w-[360px] h-[360px] bg-[#A0E9D9] rounded-lg border-2 border-[#C8EFE3]">
          {Array.from({ length: 10 * 10 }).map((_, idx) => {
            const row = Math.floor(idx / 10);
            const col = idx % 10;
            // Center the word 'BALL' in row 4 (5th row), columns 3-6 (4th-7th columns)
            const isWordRow = row === 4;
            const wordStartCol = 3;
            const word = ["B", "A", "L", "L"];
            let letter = null;
            if (
              isWordRow &&
              col >= wordStartCol &&
              col < wordStartCol + word.length
            ) {
              letter = word[col - wordStartCol];
            }
            return (
              <div
                key={idx}
                className={`flex items-center justify-center ${
                  letter
                    ? "bg-[#FFFDEB]  border-2 border-[#E6E6E6] font-bold text-[#7B5A2E] text-xl"
                    : "bg-[#B5E9DA] border-2 border-[#C8EFE3]"
                }`}
                style={{ width: 36, height: 36 }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between w-full gap-2">
        {/* Player's Letters */}
        <div className="flex gap-2 items-center">
          {letters.map((l, i) => (
            <div
              key={i}
              className="w-10 h-10 bg-[#FFFDEB] border border-[#E6E6E6] rounded-md flex flex-col items-center justify-center text-2xl font-bold text-[#B5A16E] shadow relative"
            >
              {l.letter}
              <span className="absolute bottom-1 right-1 text-xs text-[#B5A16E] font-bold">
                {l.value}
              </span>
            </div>
          ))}
          <button
            onClick={() => {}}
            className="w-10 h-10 bg-[#C8EFE3] border-2 border-[#B5E9DA] rounded-md flex items-center justify-center text-[#B5A16E] hover:bg-[#B5E9DA] transition-colors shadow-sm"
          >
            <Shuffle className="w-6 h-6" />
          </button>
        </div>

        {/* Submit Button */}
        <div className="w-full max-w-md">
          <SquabbleButton
            text="Submit word"
            variant="primary"
            disabled={false}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
