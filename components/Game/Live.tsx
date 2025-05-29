"use client";
import { useSocket } from "@/contexts/socket-context";
import {
  GameStartedEvent,
  RefreshAvailableLettersEvent,
} from "@/types/socket-events";
import { User } from "@prisma/client";
import { Logout, Shuffle } from "@solar-icons/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { DragEvent, useEffect, useState } from "react";
import SquabbleButton from "../ui/squabble-button";
import useSocketUtils from "@/hooks/use-socket-utils";

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

export default function Live({
  user,
  gameId,
  board,
  timeRemaining,
  availableLetters,
  setAvailableLetters,
  setBoard,
}: {
  user: User;
  gameId: string;
  board: string[][];
  timeRemaining: number;
  availableLetters: { letter: string; value: number }[];
  setAvailableLetters: (letters: { letter: string; value: number }[]) => void;
  setBoard: (board: string[][]) => void;
  setTimeRemaining: (time: number) => void;
}) {
  const { refreshAvailableLetters } = useSocketUtils();
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, letter: string) => {
    e.dataTransfer.setData("text/plain", letter);
    setSelectedLetter(letter);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");

    // Only place letter if the cell is empty
    if (!board[row][col]) {
      const newBoard = [...board];
      newBoard[row][col] = letter;

      // Remove the letter from available letters
      setAvailableLetters(availableLetters.filter((l) => l.letter !== letter));
    }
    setSelectedLetter(null);
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedLetter && !board[row][col]) {
      const newBoard = [...board];
      newBoard[row][col] = selectedLetter;
      setBoard(newBoard);

      // Remove the letter from available letters
      setAvailableLetters(availableLetters.filter((l) => l.letter !== selectedLetter));
      setSelectedLetter(null);
    }
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
  };

  const handleShuffle = () => {
    refreshAvailableLetters(user.fid, gameId);
  };

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

          <p className="text-black bg-white py-1 px-4 rounded-full text-xs">
            {timeRemaining}
          </p>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full max-w-3xl mx-auto">
        {players.map((p, i) => (
          <div
            key={p.name}
            className={`flex flex-row items-center bg-[#B5E9DA] rounded-md px-1 py-1 gap-1 min-w-[70px] border-2 border-[#C8EFE3] ${
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
          {Array.from({ length: 10 }, (_, rowIndex) =>
            Array.from({ length: 10 }, (_, colIndex) => {
              const letter = board[rowIndex][colIndex];

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`flex items-center justify-center uppercase cursor-pointer ${
                    letter
                      ? "bg-[#FFFDEB] border-2 border-[#E6E6E6] font-bold text-[#7B5A2E] text-xl"
                      : "bg-[#B5E9DA] border-2 border-[#C8EFE3]"
                  } ${selectedLetter ? "hover:bg-[#FFFDEB]/50" : ""}`}
                  style={{ width: 36, height: 36 }}
                  draggable={!!letter}
                  onDragStart={(e) => letter && handleDragStart(e, letter)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between w-full gap-2">
        {/* Player's Letters */}
        <div className="flex gap-2 items-center">
          {availableLetters.map((l, i) => (
            <div
              key={i}
              className={`w-10 h-10 bg-[#FFFDEB] border border-[#E6E6E6] rounded-md uppercase flex flex-col items-center justify-center text-2xl font-bold text-[#B5A16E] shadow relative cursor-pointer ${
                selectedLetter === l.letter ? "ring-2 ring-blue-500" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, l.letter)}
              onClick={() => handleLetterClick(l.letter)}
            >
              <span className={`text-2xl text-[#B5A16E] font-bold uppercase ${l.value >= 10 ? 'mr-1' : ''}`}>
                {l.letter}
              </span>
              <span className={`absolute text-xs text-[#B5A16E] font-medium uppercase bottom-0 right-0.5`}>
                {l.value}
              </span>
            </div>
          ))}
          <button
            onClick={handleShuffle}
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
