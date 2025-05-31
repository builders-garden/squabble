"use client";
import { useAudio } from "@/contexts/audio-context";
import useSocketUtils from "@/hooks/use-socket-utils";
import { formatAvatarUrl } from "@/lib/utils";
import { Player } from "@/types/socket-events";
import sdk from "@farcaster/frame-sdk";
import { User } from "@prisma/client";
import { Logout, Shuffle } from "@solar-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { DragEvent, useState } from "react";
import { toast } from "sonner";
import SquabbleButton from "../ui/squabble-button";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Live({
  user,
  gameId,
  board,
  timeRemaining,
  letterPlacers,
  availableLetters,
  setAvailableLetters,
  setBoard,
  players,
  highlightedCells,
}: {
  user: User;
  gameId: string;
  board: string[][];
  timeRemaining: number;
  availableLetters: { letter: string; value: number }[];
  setAvailableLetters: (letters: { letter: string; value: number }[]) => void;
  setBoard: (board: string[][]) => void;
  setTimeRemaining: (time: number) => void;
  letterPlacers: {
    [key: string]: Player[];
  };
  players: Player[];
  highlightedCells: Array<{ row: number; col: number }>;
}) {
  const { playSound } = useAudio();
  const { refreshAvailableLetters, placeLetter, submitWord } = useSocketUtils();
  const [selectedLetter, setSelectedLetter] = useState<{
    letter: string;
    index: number;
  } | null>(null);
  const [placedLetters, setPlacedLetters] = useState<
    Array<{ letter: string; row: number; col: number }>
  >([]);
  const [placementDirection, setPlacementDirection] = useState<
    "horizontal" | "vertical" | null
  >(null);

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    letter: { letter: string; value: number },
    index: number
  ) => {
    e.dataTransfer.setData("text/plain", letter.letter);
    e.dataTransfer.setData("index", index.toString());
    setSelectedLetter({ letter: letter.letter, index });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const isAdjacentToExistingLetter = (
    row: number,
    col: number,
    board: string[][]
  ) => {
    // Check all adjacent cells (up, down, left, right)
    const adjacentPositions = [
      [row - 1, col], // up
      [row + 1, col], // down
      [row, col - 1], // left
      [row, col + 1], // right
    ];

    return adjacentPositions.some(([r, c]) => {
      // Check if position is within board bounds
      if (r >= 0 && r < 10 && c >= 0 && c < 10) {
        return board[r][c] !== "";
      }
      return false;
    });
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const index = parseInt(e.dataTransfer.getData("index"));

    // Only place letter if the cell is empty
    if (!board[row][col]) {
      // Check if this is the first letter placement
      if (placedLetters.length === 0) {
        // For first letter, check if it's adjacent to any existing letter on the board
        if (!isAdjacentToExistingLetter(row, col, board)) {
          toast.error("Letters must be placed adjacent to existing letters!", {
            position: "top-center",
          });
          return;
        }
        setPlacementDirection(null);
      } else {
        // Check if the new placement follows the same direction as previous letters
        const lastLetter = placedLetters[placedLetters.length - 1];
        const isHorizontal = row === lastLetter.row;
        const isVertical = col === lastLetter.col;

        if (!isHorizontal && !isVertical) {
          return; // Invalid placement - must be horizontal or vertical
        }

        // Set or verify the placement direction
        if (!placementDirection) {
          setPlacementDirection(isHorizontal ? "horizontal" : "vertical");
        } else if (
          (placementDirection === "horizontal" && !isHorizontal) ||
          (placementDirection === "vertical" && !isVertical)
        ) {
          return; // Invalid placement - must follow the same direction
        }
      }

      const newBoard = [...board];
      newBoard[row][col] = letter;

      // Add the letter to placed letters with its coordinates
      setPlacedLetters([...placedLetters, { letter, row, col }]);

      // Remove the letter from available letters
      setAvailableLetters(availableLetters.filter((_, i) => i !== index));
      placeLetter(user, gameId, letter, row, col);
      setSelectedLetter(null);
      playSound("letterPlaced");
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const existingLetter = board[row][col];

    // If no letter is selected and we click on a placed letter, remove it
    if (!selectedLetter && existingLetter) {
      // Only allow removing letters that were placed in the current turn
      const placedLetterIndex = placedLetters.findIndex(
        (l) => l.row === row && l.col === col
      );

      if (placedLetterIndex !== -1) {
        const newBoard = [...board];
        newBoard[row][col] = "";
        setBoard(newBoard);

        // Add the letter back to available letters
        setAvailableLetters([
          ...availableLetters,
          { letter: existingLetter, value: 1 },
        ]);

        // Remove from placed letters
        const newPlacedLetters = [...placedLetters];
        newPlacedLetters.splice(placedLetterIndex, 1);
        setPlacedLetters(newPlacedLetters);

        // If this was the last placed letter, reset direction
        if (newPlacedLetters.length === 0) {
          setPlacementDirection(null);
        }

        playSound("letterRemoved");

        return;
      }
    }

    // Handle placing a new letter
    if (selectedLetter && !existingLetter) {
      // Check if this is the first letter placement
      if (placedLetters.length === 0) {
        // For first letter, check if it's adjacent to any existing letter on the board
        if (!isAdjacentToExistingLetter(row, col, board)) {
          toast.error("Letters must be placed adjacent to existing letters!");
          return;
        }
        setPlacementDirection(null);
      } else {
        // Check if the new placement follows the same direction as previous letters
        const lastLetter = placedLetters[placedLetters.length - 1];
        const isHorizontal = row === lastLetter.row;
        const isVertical = col === lastLetter.col;

        if (!isHorizontal && !isVertical) {
          return; // Invalid placement - must be horizontal or vertical
        }

        // Set or verify the placement direction
        if (!placementDirection) {
          setPlacementDirection(isHorizontal ? "horizontal" : "vertical");
        } else if (
          (placementDirection === "horizontal" && !isHorizontal) ||
          (placementDirection === "vertical" && !isVertical)
        ) {
          return; // Invalid placement - must follow the same direction
        }
      }

      const newBoard = [...board];
      newBoard[row][col] = selectedLetter.letter;
      setBoard(newBoard);

      // Add the letter to placed letters with its coordinates
      setPlacedLetters([
        ...placedLetters,
        { letter: selectedLetter.letter, row, col },
      ]);

      // Remove the letter from available letters
      setAvailableLetters(
        availableLetters.filter((_, i) => i !== selectedLetter.index)
      );
      placeLetter(user, gameId, selectedLetter.letter, row, col);
      setSelectedLetter(null);
      playSound("letterPlaced");
    }
  };

  const handleLetterClick = (
    letter: { letter: string; value: number },
    index: number
  ) => {
    setSelectedLetter({ letter: letter.letter, index });
  };

  const handleShuffle = () => {
    // Clear placed letters from the board
    const newBoard = [...board];
    placedLetters.forEach(({ row, col }) => {
      newBoard[row][col] = "";
    });
    setBoard(newBoard);
    setPlacedLetters([]);
    setPlacementDirection(null);

    // Start sounds slightly before the animation
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        playSound("shuffleLetters");
      }, i * 75); // Reduced to 50ms between sounds for snappier feedback
    }

    // Start the animation
    setTimeout(() => {
      refreshAvailableLetters(user.fid, gameId);
    }, 125); // Small delay to let sounds start first
  };

  const handleExitGame = async () => {
    await sdk.actions.close();
  };

  const handleSubmitWord = () => {
    if (placedLetters.length === 0) return;

    // Get all connected letters in the same direction
    const connectedLetters: Array<{
      letter: string;
      row: number;
      col: number;
    }> = [];
    const visited = new Set<string>();

    // Helper function to get connected letters in a direction
    const getConnectedLetters = (
      row: number,
      col: number,
      direction: "horizontal" | "vertical"
    ) => {
      const key = `${row}-${col}`;
      if (visited.has(key)) return;
      visited.add(key);

      const letter = board[row][col];
      if (!letter) return;

      // Add the letter if it's not already in placedLetters
      if (!placedLetters.some((l) => l.row === row && l.col === col)) {
        connectedLetters.push({ letter, row, col });
      }

      // Check adjacent cells in the same direction
      if (direction === "horizontal") {
        if (col > 0) getConnectedLetters(row, col - 1, direction);
        if (col < 9) getConnectedLetters(row, col + 1, direction);
      } else {
        if (row > 0) getConnectedLetters(row - 1, col, direction);
        if (row < 9) getConnectedLetters(row + 1, col, direction);
      }
    };

    // Start from each placed letter and get connected letters
    placedLetters.forEach(({ row, col }) => {
      if (placementDirection === "horizontal") {
        getConnectedLetters(row, col, "horizontal");
      } else {
        getConnectedLetters(row, col, "vertical");
      }
    });

    // Combine placed letters with connected letters
    const allLetters = [...placedLetters, ...connectedLetters];

    // Sort all letters by their position
    const sortedLetters = allLetters.sort((a, b) => {
      if (placementDirection === "horizontal") {
        return a.col - b.col;
      } else {
        return a.row - b.row;
      }
    });

    const word = sortedLetters.map((l) => l.letter).join("");
    const path = sortedLetters.map((l) => ({ x: l.col, y: l.row }));

    submitWord(
      user,
      gameId,
      word,
      path,
      true,
      placedLetters.map((l) => ({ letter: l.letter, x: l.col, y: l.row }))
    );

    // Reset the placed letters and direction after submission
    setPlacedLetters([]);
    setPlacementDirection(null);
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
          <div
            className="flex flex-row items-center gap-1 text-red-600 bg-red-600/25 py-1 px-4 rounded-full text-xs cursor-pointer"
            onClick={handleExitGame}
          >
            <p>Exit</p>
            <Logout size={12} />
          </div>

          <p className="text-black bg-white py-1 px-4 rounded-full text-xs w-16 text-center">
            {Math.floor(timeRemaining / 60)}:
            {String(timeRemaining % 60).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full max-w-3xl mx-auto">
        {players
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((p, i) => (
            <motion.div
              key={`${p.fid}-${p.score}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              className={`flex flex-row items-center bg-[#B5E9DA] rounded-md px-1 py-1 gap-1 min-w-[70px] border-2 border-[#C8EFE3]  ${
                p.fid === user?.fid ? "ring-2 ring-blue-400" : ""
              }`}
            >
              <div className="text-xs text-white rounded-full font-bold">
                {i + 1}
              </div>
              <Image
                src={formatAvatarUrl(p.avatarUrl || "")}
                className="w-6 h-6 rounded-full object-cover"
                alt={p.displayName || p.username || ""}
                width={32}
                height={32}
              />
              <div className="flex flex-col items-start">
                <div className="text-xs text-white truncate max-w-[60px]">
                  {p.displayName || p.username || ""}
                </div>
                <div className="text-xs text-white font-bold">
                  {p.score || 0}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Game Board */}
      <div className="bg-[#B5E9DA] rounded-xl p-2 flex flex-col items-center">
        <div className="gap-0 grid grid-cols-10 grid-rows-10 w-[360px] h-[360px] bg-[#A0E9D9] rounded-lg border-2 border-[#C8EFE3]">
          {Array.from({ length: 10 }, (_, rowIndex) =>
            Array.from({ length: 10 }, (_, colIndex) => {
              const letter = board[rowIndex][colIndex];
              const isPlaced = letterPlacers[`${rowIndex}-${colIndex}`];
              const isHighlighted = highlightedCells.some(
                (cell) => cell.row === rowIndex && cell.col === colIndex
              );
              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  className={`flex items-center justify-center uppercase cursor-pointer relative ${
                    letter
                      ? "bg-[#FFFDEB] border-2 border-[#E6E6E6] font-bold text-[#7B5A2E] text-xl"
                      : "bg-[#B5E9DA] border-2 border-[#C8EFE3]"
                  } ${selectedLetter ? "hover:bg-[#FFFDEB]/50" : ""}`}
                  style={{ width: 36, height: 36 }}
                  draggable={!!letter}
                  onDragStart={(e) =>
                    letter && handleDragStart(e as any, { letter, value: 1 }, 0)
                  }
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  <motion.div
                    animate={
                      isHighlighted
                        ? {
                            scale: [1, 1.2, 1],
                            color: ["#7B5A2E", "#FFD700", "#7B5A2E"],
                            transition: {
                              duration: 1.5,
                              times: [0, 0.5, 1],
                              repeat: 0,
                            },
                          }
                        : {}
                    }
                    className="text-xl font-bold"
                  >
                    {letter}
                  </motion.div>
                  {isPlaced && !letter && isPlaced.length > 0 && (
                    <div className="absolute bottom-0.5 left-0.5 flex -space-x-1">
                      {isPlaced
                        .filter((p) => p.fid !== user.fid)
                        .map((player, idx) => (
                          <div
                            key={player.fid}
                            className="w-3 h-3 rounded-full overflow-hidden border border-white"
                          >
                            <Image
                              src={formatAvatarUrl(player.avatarUrl || "")}
                              alt={player.displayName || player.username || ""}
                              width={12}
                              height={12}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between w-full gap-2">
        {/* Player's Letters */}
        <div className="flex gap-2 items-center">
          <AnimatePresence mode="popLayout">
            {availableLetters.map((l, i) => (
              <motion.div
                key={`${l.letter}-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                layout
              >
                <div
                  className={`w-10 h-10 bg-[#FFFDEB] border border-[#E6E6E6] rounded-md uppercase flex flex-col items-center justify-center text-2xl font-bold text-[#B5A16E] shadow relative cursor-pointer ${
                    selectedLetter?.index === i ? "ring-2 ring-blue-500" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, l, i)}
                  onClick={() => handleLetterClick(l, i)}
                >
                  <span
                    className={`text-2xl text-[#B5A16E] font-bold uppercase ${
                      l.value >= 10 ? "mr-1" : ""
                    }`}
                  >
                    {l.letter}
                  </span>
                  <span
                    className={`absolute text-xs text-[#B5A16E] font-medium uppercase bottom-0 right-0.5`}
                  >
                    {l.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShuffle}
            className="w-10 h-10 bg-[#C8EFE3] border-2 border-[#B5E9DA] rounded-md flex items-center justify-center text-[#B5A16E] hover:bg-[#B5E9DA] transition-colors shadow-sm"
          >
            <Shuffle className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Submit Button */}
        <div className="w-full max-w-md">
          <SquabbleButton
            text="Submit word"
            variant="primary"
            disabled={false}
            onClick={handleSubmitWord}
          />
        </div>
      </div>
    </div>
  );
}
