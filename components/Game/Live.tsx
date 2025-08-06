"use client";

import sdk from "@farcaster/miniapp-sdk";
import { User } from "@prisma/client";
import { LogOutIcon, ShuffleIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { DragEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import SquabbleButton from "@/components/ui/squabble-button";
import UserAvatar from "@/components/ui/user-avatar";
import { useAudio } from "@/contexts/audio-context";
import { useGame } from "@/contexts/game-context";
import useSocketUtils from "@/hooks/use-socket-utils";
import { trackEvent } from "@/lib/posthog/client";
import { cn, formatAvatarUrl } from "@/lib/utils";
import { Player } from "@/types/socket";
import Loading from "./Loading";

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

  // Add new effect to sync placedLetters with board state
  useEffect(() => {
    // Remove any placedLetters that no longer match the board state
    // This handles when another player submits a word that overlaps with our placed letters
    setPlacedLetters((prev) =>
      prev.filter((placed) => board[placed.row][placed.col] === placed.letter),
    );
  }, [board]);
  const [placementDirection, setPlacementDirection] = useState<
    "horizontal" | "vertical" | null
  >(null);
  const [validPlacementCells, setValidPlacementCells] = useState<
    Array<{ row: number; col: number }>
  >([]);
  const [wordCellsToHighlight, setWordCellsToHighlight] = useState<
    Array<{ row: number; col: number }>
  >([]);
  const { currentPlayer } = useGame();

  // Calculate submit button position based on placed letters
  const getSubmitButtonPosition = () => {
    if (placedLetters.length === 0) return null;

    // Get the last placed letter position
    const lastLetter = placedLetters[placedLetters.length - 1];

    // Constants for positioning (36px is the cell size)
    const CELL_SIZE = 36;
    const MARGIN = 12; // Adding margin for better spacing

    // If we have a placement direction, position the button at the end of the word
    if (placementDirection) {
      const allLetters = [...placedLetters].sort((a, b) => {
        if (placementDirection === "horizontal") {
          return b.col - a.col;
        }
        return b.row - a.row;
      });

      const lastPos = allLetters[0];

      if (placementDirection === "horizontal") {
        // Check if there's a valid placement cell to the right
        const hasValidRight = validPlacementCells.some(
          (cell) => cell.row === lastPos.row && cell.col === lastPos.col + 1,
        );

        if (hasValidRight) {
          // If there's a valid placement to the right, position the button above with margin
          return {
            left: `${lastPos.col * CELL_SIZE - MARGIN}px`,
            top: `${(lastPos.row - 1) * CELL_SIZE - MARGIN}px`,
          };
        }

        // Otherwise position to the right with margin
        return {
          left: `${(lastPos.col + 1) * CELL_SIZE + MARGIN}px`,
          top: `${lastPos.row * CELL_SIZE}px`,
        };
      } else {
        // Check if there's a valid placement cell below
        const hasValidBelow = validPlacementCells.some(
          (cell) => cell.col === lastPos.col && cell.row === lastPos.row + 1,
        );

        if (hasValidBelow) {
          // If there's a valid placement below, position the button to the right with margin
          return {
            left: `${(lastPos.col + 1) * CELL_SIZE + MARGIN}px`,
            top: `${lastPos.row * CELL_SIZE}px`,
          };
        }

        // Otherwise position below with margin
        return {
          left: `${lastPos.col * CELL_SIZE}px`,
          top: `${(lastPos.row + 1) * CELL_SIZE + MARGIN}px`,
        };
      }
    }

    // For single letters, check valid placements in all directions
    const hasValidRight = validPlacementCells.some(
      (cell) => cell.row === lastLetter.row && cell.col === lastLetter.col + 1,
    );
    const hasValidBelow = validPlacementCells.some(
      (cell) => cell.col === lastLetter.col && cell.row === lastLetter.row + 1,
    );

    if (!hasValidRight && !hasValidBelow) {
      // If no valid placements right or below, put it to the right with margin
      return {
        left: `${(lastLetter.col + 1) * CELL_SIZE + MARGIN}px`,
        top: `${lastLetter.row * CELL_SIZE}px`,
      };
    } else if (!hasValidRight) {
      // If can't place right, put it to the right with margin
      return {
        left: `${(lastLetter.col + 1) * CELL_SIZE + MARGIN}px`,
        top: `${lastLetter.row * CELL_SIZE}px`,
      };
    } else if (!hasValidBelow) {
      // If can't place below, put it below with margin
      return {
        left: `${lastLetter.col * CELL_SIZE}px`,
        top: `${(lastLetter.row + 1) * CELL_SIZE + MARGIN}px`,
      };
    } else {
      // If both directions are valid, put it diagonally with margin
      return {
        left: `${(lastLetter.col + 1) * CELL_SIZE + MARGIN}px`,
        top: `${(lastLetter.row + 1) * CELL_SIZE + MARGIN}px`,
      };
    }
  };

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    letter: { letter: string; value: number },
    index: number,
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
    board: string[][],
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

  const calculateValidPlacementCells = () => {
    if (placedLetters.length === 0) {
      // If no letters placed yet, all cells adjacent to existing letters are valid
      const validCells: Array<{ row: number; col: number }> = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (!board[row][col] && isAdjacentToExistingLetter(row, col, board)) {
            validCells.push({ row, col });
          }
        }
      }
      setValidPlacementCells(validCells);
    } else if (placementDirection) {
      // Find the full extent of the word in the current direction (including board and placedLetters)
      // Start from any placed letter, then walk in both directions to collect all connected letters
      let startRow = placedLetters[0].row;
      let startCol = placedLetters[0].col;
      let min: number, max: number, fixed: number;
      if (placementDirection === "horizontal") {
        fixed = startRow;
        // Walk left
        min = startCol;
        while (min > 0 && board[fixed][min - 1]) {
          min--;
        }
        // Walk right
        max = startCol;
        while (max < 9 && board[fixed][max + 1]) {
          max++;
        }
        const validCells: Array<{ row: number; col: number }> = [];
        // Check cell before min
        if (min > 0 && !board[fixed][min - 1]) {
          validCells.push({ row: fixed, col: min - 1 });
        }
        // Check cell after max
        if (max < 9 && !board[fixed][max + 1]) {
          validCells.push({ row: fixed, col: max + 1 });
        }
        setValidPlacementCells(validCells);
      } else {
        fixed = startCol;
        // Walk up
        min = startRow;
        while (min > 0 && board[min - 1][fixed]) {
          min--;
        }
        // Walk down
        max = startRow;
        while (max < 9 && board[max + 1][fixed]) {
          max++;
        }
        const validCells: Array<{ row: number; col: number }> = [];
        // Check cell before min
        if (min > 0 && !board[min - 1][fixed]) {
          validCells.push({ row: min - 1, col: fixed });
        }
        // Check cell after max
        if (max < 9 && !board[max + 1][fixed]) {
          validCells.push({ row: max + 1, col: fixed });
        }
        setValidPlacementCells(validCells);
      }
    } else {
      // If only one letter placed this turn
      if (placedLetters.length === 1) {
        const { row, col } = placedLetters[0];
        const directions = [
          [0, 1], // right
          [0, -1], // left
          [1, 0], // down
          [-1, 0], // up
        ];
        // Check if adjacent to any existing letter
        let isAdjacentToExisting = false;
        for (const [dr, dc] of directions) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
            if (board[nr][nc]) {
              isAdjacentToExisting = true;
              break;
            }
          }
        }
        if (isAdjacentToExisting) {
          // Try both directions: horizontal and vertical
          let validCells: Array<{ row: number; col: number }> = [];
          // Horizontal
          let minCol = col,
            maxCol = col;
          while (
            minCol > 0 &&
            (board[row][minCol - 1] ||
              (placedLetters[0].col === minCol - 1 &&
                placedLetters[0].row === row))
          )
            minCol--;
          while (
            maxCol < 9 &&
            (board[row][maxCol + 1] ||
              (placedLetters[0].col === maxCol + 1 &&
                placedLetters[0].row === row))
          )
            maxCol++;
          if (
            minCol > 0 &&
            !board[row][minCol - 1] &&
            !placedLetters.some((l) => l.row === row && l.col === minCol - 1)
          ) {
            validCells.push({ row, col: minCol - 1 });
          }
          if (
            maxCol < 9 &&
            !board[row][maxCol + 1] &&
            !placedLetters.some((l) => l.row === row && l.col === maxCol + 1)
          ) {
            validCells.push({ row, col: maxCol + 1 });
          }
          // Vertical
          let minRow = row,
            maxRow = row;
          while (
            minRow > 0 &&
            (board[minRow - 1][col] ||
              (placedLetters[0].row === minRow - 1 &&
                placedLetters[0].col === col))
          )
            minRow--;
          while (
            maxRow < 9 &&
            (board[maxRow + 1][col] ||
              (placedLetters[0].row === maxRow + 1 &&
                placedLetters[0].col === col))
          )
            maxRow++;
          if (
            minRow > 0 &&
            !board[minRow - 1][col] &&
            !placedLetters.some((l) => l.row === minRow - 1 && l.col === col)
          ) {
            validCells.push({ row: minRow - 1, col });
          }
          if (
            maxRow < 9 &&
            !board[maxRow + 1][col] &&
            !placedLetters.some((l) => l.row === maxRow + 1 && l.col === col)
          ) {
            validCells.push({ row: maxRow + 1, col });
          }
          setValidPlacementCells(validCells);
          return;
        } else {
          // Not adjacent to any existing letter: allow all four adjacent cells
          const validCells: Array<{ row: number; col: number }> = [];
          directions.forEach(([dr, dc]) => {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
              if (
                !board[nr][nc] &&
                !placedLetters.some((l) => l.row === nr && l.col === nc)
              ) {
                validCells.push({ row: nr, col: nc });
              }
            }
          });
          setValidPlacementCells(validCells);
          return;
        }
      }
      // Otherwise, allow placement only at the ends of the contiguous word (including placed and existing letters)
      // 1. Find all connected letters (placed this turn + already on the board, contiguous)
      const connectedSet = new Set<string>();
      const visited = new Set<string>();
      const directions = [
        [0, 1], // right
        [0, -1], // left
        [1, 0], // down
        [-1, 0], // up
      ];
      // Helper to walk and collect all connected letters
      const walk = (row: number, col: number) => {
        const key = `${row}-${col}`;
        if (visited.has(key)) return;
        visited.add(key);
        if (
          !board[row][col] &&
          !placedLetters.some((l) => l.row === row && l.col === col)
        )
          return;
        connectedSet.add(key);
        for (const [dr, dc] of directions) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
            if (
              board[nr][nc] ||
              placedLetters.some((l) => l.row === nr && l.col === nc)
            ) {
              walk(nr, nc);
            }
          }
        }
      };
      // Start from each placed letter
      placedLetters.forEach(({ row, col }) => walk(row, col));
      // Convert connectedSet to array of {row, col}
      const connectedArr = Array.from(connectedSet).map((key) => {
        const [row, col] = key.split("-").map(Number);
        return { row, col };
      });
      // Determine if the word is horizontal or vertical
      let validCells: Array<{ row: number; col: number }> = [];
      const allRows = connectedArr.map((l) => l.row);
      const allCols = connectedArr.map((l) => l.col);
      const isHorizontal = allRows.every((r) => r === allRows[0]);
      const isVertical = allCols.every((c) => c === allCols[0]);
      if (isHorizontal) {
        // Find min and max col
        const row = allRows[0];
        const minCol = Math.min(...allCols);
        const maxCol = Math.max(...allCols);
        // Check cell before minCol
        if (
          minCol > 0 &&
          !board[row][minCol - 1] &&
          !placedLetters.some((l) => l.row === row && l.col === minCol - 1)
        ) {
          validCells.push({ row, col: minCol - 1 });
        }
        // Check cell after maxCol
        if (
          maxCol < 9 &&
          !board[row][maxCol + 1] &&
          !placedLetters.some((l) => l.row === row && l.col === maxCol + 1)
        ) {
          validCells.push({ row, col: maxCol + 1 });
        }
      } else if (isVertical) {
        // Find min and max row
        const col = allCols[0];
        const minRow = Math.min(...allRows);
        const maxRow = Math.max(...allRows);
        // Check cell before minRow
        if (
          minRow > 0 &&
          !board[minRow - 1][col] &&
          !placedLetters.some((l) => l.row === minRow - 1 && l.col === col)
        ) {
          validCells.push({ row: minRow - 1, col });
        }
        // Check cell after maxRow
        if (
          maxRow < 9 &&
          !board[maxRow + 1][col] &&
          !placedLetters.some((l) => l.row === maxRow + 1 && l.col === col)
        ) {
          validCells.push({ row: maxRow + 1, col });
        }
      }
      setValidPlacementCells(validCells);
    }
  };

  // Update valid placement cells whenever placedLetters or board changes
  useEffect(() => {
    calculateValidPlacementCells();
  }, [placedLetters, board]);

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    row: number,
    col: number,
  ) => {
    e.preventDefault();
    if (!currentPlayer) {
      console.warn("Cannot handle drop: No current player found");
      return;
    }
    const letter = e.dataTransfer.getData("text/plain");
    const index = parseInt(e.dataTransfer.getData("index"));

    // Only place letter if the cell is empty
    if (!board[row][col]) {
      // Check if this is a valid placement cell
      const isValidPlacement = validPlacementCells.some(
        (cell) => cell.row === row && cell.col === col,
      );

      if (!isValidPlacement) {
        toast.custom(
          (t) => (
            <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow animate-shake">
              <div className="text-red-600 font-medium text-sm">
                ❌ Invalid placement!
              </div>
            </div>
          ),
          {
            position: "top-left",
            duration: 5000,
          },
        );
        return;
      }

      // Check if this is the first letter placement
      if (placedLetters.length === 0) {
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
      placeLetter({
        player: currentPlayer,
        gameId,
        letter,
        x: row,
        y: col,
      });
      setSelectedLetter(null);
      playSound("letterPlaced");

      trackEvent("letter_placed", {
        fid: currentPlayer.fid,
        letter,
        row,
        col,
        gameId,
      });
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!currentPlayer) {
      console.warn("Cannot handle cell click: No current player found");
      return;
    }
    const existingLetter = board[row][col];

    // If we have a selected letter and click on a placed letter, swap them
    if (selectedLetter && existingLetter) {
      // Find if this letter was placed in current turn
      const placedLetterIndex = placedLetters.findIndex(
        (l) => l.row === row && l.col === col,
      );

      // Only allow replacing letters placed in current turn
      if (placedLetterIndex !== -1) {
        const newBoard = [...board];
        newBoard[row][col] = selectedLetter.letter;
        setBoard(newBoard);

        // Update placedLetters array
        const newPlacedLetters = [...placedLetters];
        newPlacedLetters[placedLetterIndex] = {
          letter: selectedLetter.letter,
          row,
          col,
        };
        setPlacedLetters(newPlacedLetters);

        // Update available letters: add the old letter and remove the selected one
        const newAvailableLetters = availableLetters.filter(
          (_, i) => i !== selectedLetter.index,
        );
        newAvailableLetters.push({ letter: existingLetter, value: 1 });
        setAvailableLetters(newAvailableLetters);

        placeLetter({
          player: currentPlayer,
          gameId,
          letter: selectedLetter.letter,
          x: row,
          y: col,
        });
        setSelectedLetter(null);
        playSound("letterPlaced");

        trackEvent("letter_replaced", {
          fid: currentPlayer.fid,
          letter: selectedLetter.letter,
          row,
          col,
          gameId,
        });
        return;
      }
    }

    // If no letter is selected and we click on a placed letter, remove it
    if (!selectedLetter && existingLetter) {
      // Only allow removing letters that were placed in the current turn
      const placedLetterIndex = placedLetters.findIndex(
        (l) => l.row === row && l.col === col,
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
      // Check if this is a valid placement cell
      const isValidPlacement = validPlacementCells.some(
        (cell) => cell.row === row && cell.col === col,
      );

      if (!isValidPlacement) {
        toast.custom(
          (t) => (
            <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow animate-shake">
              <div className="text-red-600 font-medium text-sm">
                ❌ Invalid placement!
              </div>
            </div>
          ),
          {
            position: "top-left",
            duration: 5000,
          },
        );
        return;
      }

      // Check if this is the first letter placement
      if (placedLetters.length === 0) {
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
        availableLetters.filter((_, i) => i !== selectedLetter.index),
      );
      placeLetter({
        player: currentPlayer,
        gameId,
        letter: selectedLetter.letter,
        x: row,
        y: col,
      });
      setSelectedLetter(null);
      playSound("letterPlaced");
    }
  };

  const handleLetterClick = (
    letter: { letter: string; value: number },
    index: number,
  ) => {
    // If clicking the same letter that's already selected, deselect it
    if (selectedLetter?.index === index) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter({ letter: letter.letter, index });
    }
  };

  const handleShuffle = () => {
    if (!currentPlayer) {
      console.warn("Cannot handle shuffle: No current player found");
      return;
    }
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
      refreshAvailableLetters({ playerId: user.fid, gameId });
    }, 125); // Small delay to let sounds start first

    trackEvent("shuffle_letters", {
      fid: currentPlayer.fid,
      gameId,
    });
  };

  const handleExitGame = async () => {
    await sdk.actions.close();
  };

  const handleSubmitWord = () => {
    if (placedLetters.length === 0) return;

    if (!currentPlayer) {
      console.warn("Cannot handle submit word: No current player found");
      return;
    }

    // Special handling for single letter placement
    if (placedLetters.length === 1) {
      const { row, col, letter } = placedLetters[0];
      // Collect horizontal word
      let hCol = col;
      while (hCol > 0 && board[row][hCol - 1]) hCol--;
      const horizontalLetters = [];
      for (let c = hCol; c < 10 && board[row][c]; c++) {
        horizontalLetters.push({ letter: board[row][c], row, col: c });
      }
      // Insert the placed letter if not already present
      if (!horizontalLetters.some((l) => l.row === row && l.col === col)) {
        horizontalLetters.push({ letter, row, col });
        horizontalLetters.sort((a, b) => a.col - b.col);
      }

      // Collect vertical word
      let vRow = row;
      while (vRow > 0 && board[vRow - 1][col]) vRow--;
      const verticalLetters = [];
      for (let r = vRow; r < 10 && board[r][col]; r++) {
        verticalLetters.push({ letter: board[r][col], row: r, col });
      }
      if (!verticalLetters.some((l) => l.row === row && l.col === col)) {
        verticalLetters.push({ letter, row, col });
        verticalLetters.sort((a, b) => a.row - b.row);
      }

      // Pick the longer word (or horizontal if equal)
      const mainWord =
        horizontalLetters.length >= verticalLetters.length
          ? horizontalLetters
          : verticalLetters;
      const word = mainWord.map((l) => l.letter).join("");
      const path = mainWord.map((l) => ({ x: l.col, y: l.row }));

      submitWord({
        player: currentPlayer,
        gameId,
        word,
        path,
        isNew: true,
        placedLetters: placedLetters.map((l) => ({
          letter: l.letter,
          x: l.col,
          y: l.row,
        })),
      });

      // Reset the placed letters and direction after submission
      setPlacedLetters([]);
      setPlacementDirection(null);

      trackEvent("word_submitted", {
        fid: currentPlayer.fid,
        word,
        path,
        letters: placedLetters.map((l) => l.letter),
        gameId,
      });
      return;
    }

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
      direction: "horizontal" | "vertical",
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

    submitWord({
      player: currentPlayer,
      gameId,
      word,
      path,
      isNew: true,
      placedLetters: placedLetters.map((l) => ({
        letter: l.letter,
        x: l.col,
        y: l.row,
      })),
    });

    // Reset the placed letters and direction after submission
    setPlacedLetters([]);
    setPlacementDirection(null);
  };

  // Helper to check for gaps in the word being formed
  const hasGapInWord = () => {
    if (placedLetters.length === 0 || !placementDirection) return false;

    // Get all connected letters in the same direction (copied from handleSubmitWord)
    const connectedLetters: Array<{
      letter: string;
      row: number;
      col: number;
    }> = [];
    const visited = new Set<string>();
    const getConnectedLetters = (
      row: number,
      col: number,
      direction: "horizontal" | "vertical",
    ) => {
      const key = `${row}-${col}`;
      if (visited.has(key)) return;
      visited.add(key);
      const letter = board[row][col];
      if (!letter) return;
      if (!placedLetters.some((l) => l.row === row && l.col === col)) {
        connectedLetters.push({ letter, row, col });
      }
      if (direction === "horizontal") {
        if (col > 0) getConnectedLetters(row, col - 1, direction);
        if (col < 9) getConnectedLetters(row, col + 1, direction);
      } else {
        if (row > 0) getConnectedLetters(row - 1, col, direction);
        if (row < 9) getConnectedLetters(row + 1, col, direction);
      }
    };
    placedLetters.forEach(({ row, col }) => {
      if (placementDirection === "horizontal") {
        getConnectedLetters(row, col, "horizontal");
      } else {
        getConnectedLetters(row, col, "vertical");
      }
    });
    const allLetters = [...placedLetters, ...connectedLetters];
    if (allLetters.length === 0) return false;
    // Find min/max in the direction
    let min: number, max: number, fixed: number;
    if (placementDirection === "horizontal") {
      min = Math.min(...allLetters.map((l) => l.col));
      max = Math.max(...allLetters.map((l) => l.col));
      fixed = allLetters[0].row;
      for (let c = min; c <= max; c++) {
        if (!board[fixed][c]) return true;
      }
    } else {
      min = Math.min(...allLetters.map((l) => l.row));
      max = Math.max(...allLetters.map((l) => l.row));
      fixed = allLetters[0].col;
      for (let r = min; r <= max; r++) {
        if (!board[r][fixed]) return true;
      }
    }
    return false;
  };

  // Checks if any placed letter is adjacent to an existing letter on the board (not part of placedLetters)
  const isWordConnectedToBoard = () => {
    if (placedLetters.length === 0) return false;
    // Create a set of placed letter positions for quick lookup
    const placedSet = new Set(placedLetters.map((l) => `${l.row}-${l.col}`));
    for (const { row, col } of placedLetters) {
      const adjacentPositions = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];
      for (const [r, c] of adjacentPositions) {
        if (r >= 0 && r < 10 && c >= 0 && c < 10) {
          if (board[r][c] !== "" && !placedSet.has(`${r}-${c}`)) {
            return true;
          }
        }
      }
    }
    // Special case: if the board is empty except for placedLetters, allow the first word
    const boardHasOtherLetters = board.some((rowArr, rIdx) =>
      rowArr.some(
        (cell, cIdx) => cell !== "" && !placedSet.has(`${rIdx}-${cIdx}`),
      ),
    );
    return !boardHasOtherLetters;
  };

  // This useEffect highlights all cells that are part of any word (main or cross) that would be submitted
  // It works in three steps:
  // 1. Find all horizontal words (including cross words)
  // 2. Find all vertical words (including cross words)
  // 3. Handle special case for new words not touching existing letters
  // biome-ignore lint/correctness/useExhaustiveDependencies: not needed
  useEffect(() => {
    let highlightCells: Array<{ row: number; col: number }> = [];

    // Helper function to check if a cell is part of the current turn
    const isCellPlacedThisTurn = (row: number, col: number) =>
      placedLetters.some((l) => l.row === row && l.col === col);

    // Helper function to check if a cell has a letter (either from board or current turn)
    const hasLetter = (row: number, col: number) =>
      board[row][col] !== "" || isCellPlacedThisTurn(row, col);

    // Helper function to process a segment of cells
    const processSegment = (segment: Array<{ row: number; col: number }>) => {
      if (segment.length === 0) return;

      if (
        segment.length > 1 &&
        segment.some((cell) => isCellPlacedThisTurn(cell.row, cell.col))
      ) {
        highlightCells.push(...segment);
      }
    };

    // Step 1: Find horizontal words
    for (let row = 0; row < 10; row++) {
      let segment: Array<{ row: number; col: number }> = [];

      for (let col = 0; col < 10; col++) {
        if (hasLetter(row, col)) {
          segment.push({ row, col });
        } else {
          processSegment(segment);
          segment = [];
        }
      }
      processSegment(segment);
    }

    // Step 2: Find vertical words
    for (let col = 0; col < 10; col++) {
      let segment: Array<{ row: number; col: number }> = [];

      for (let row = 0; row < 10; row++) {
        if (hasLetter(row, col)) {
          segment.push({ row, col });
        } else {
          processSegment(segment);
          segment = [];
        }
      }
      // Don't forget to process the last segment in the column
      processSegment(segment);
    }

    // Step 3: Handle special case for new words not touching existing letters
    if (placedLetters.length > 1) {
      // Check if all placed letters are in the same row
      const sameRow = placedLetters.every(
        (l) => l.row === placedLetters[0].row,
      );
      if (sameRow) {
        const row = placedLetters[0].row;
        const cols = placedLetters.map((l) => l.col).sort((a, b) => a - b);

        // Check if letters are contiguous
        const isContiguous = cols.every(
          (col, i) => i === 0 || col === cols[i - 1] + 1,
        );
        if (isContiguous && cols.length > 1) {
          highlightCells.push(...cols.map((col) => ({ row, col })));
        }
      }

      // Check if all placed letters are in the same column
      const sameCol = placedLetters.every(
        (l) => l.col === placedLetters[0].col,
      );
      if (sameCol) {
        const col = placedLetters[0].col;
        const rows = placedLetters.map((l) => l.row).sort((a, b) => a - b);

        // Check if letters are contiguous
        const isContiguous = rows.every(
          (row, i) => i === 0 || row === rows[i - 1] + 1,
        );

        if (isContiguous && rows.length > 1) {
          highlightCells.push(...rows.map((row) => ({ row, col })));
        }
      }
    }

    // Remove any duplicate cells
    const uniqueCells = Array.from(
      new Set(highlightCells.map((cell) => `${cell.row}-${cell.col}`)),
    ).map((key) => {
      const [r, c] = key.split("-").map(Number);
      return { row: r, col: c };
    });

    setWordCellsToHighlight(uniqueCells);
  }, [placedLetters, placementDirection, board]);

  // If board is not defined, show loading state
  if (!board) {
    return (
      <Loading title="Loading game..." body="Waiting for game to start..." />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-between p-4">
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
            className={`${luckiestGuy.className} text-xl text-white tracking-wider`}>
            SQUABBLE
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <button
            type="button"
            className="flex flex-row items-center gap-1 text-white font-medium bg-red-800/75  py-1 px-4 rounded-full text-xs cursor-pointer"
            onClick={handleExitGame}>
            <p>Exit</p>
            <LogOutIcon size={12} />
          </button>

          <motion.div
            key={timeRemaining}
            initial={
              timeRemaining === 60
                ? { backgroundColor: "#ffffff", color: "#000000" }
                : false
            }
            animate={
              timeRemaining === 60
                ? {
                    backgroundColor: [
                      "#ffffff",
                      "#ffdddd",
                      "#ff0000",
                      "#ff0000",
                      "#ffdddd",
                      "#ffffff",
                    ],
                    color: [
                      "#000000",
                      "#ffffff",
                      "#ffffff",
                      "#ffffff",
                      "#ffffff",
                      "#000000",
                    ],
                    transition: {
                      duration: 3,
                      times: [0, 0.15, 0.3, 0.7, 0.85, 1],
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }
                : {}
            }
            className={`text-black bg-white py-1 px-4 rounded-full text-xs w-16 text-center ${
              timeRemaining <= 60 ? "text-red-600" : ""
            }`}>
            {Math.floor(timeRemaining / 60)}:
            {String(timeRemaining % 60).padStart(2, "0")}
          </motion.div>
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
              className={`flex flex-row items-center bg-white/15 rounded-md px-1 py-1 gap-1 min-w-[70px] border-2 border-[#C8EFE3]  ${
                p.fid === user?.fid
                  ? "bg-blue-300/15 border-2 border-blue-300"
                  : ""
              }`}>
              <div className="text-xs text-white rounded-full font-bold">
                {i + 1}
              </div>
              <UserAvatar
                avatarUrl={
                  p.avatarUrl ? formatAvatarUrl(p.avatarUrl) : undefined
                }
                username={p.username}
                size="xs"
                className={`${
                  p.fid === user?.fid ? "border-blue-300" : "border-[#C8EFE3]"
                }`}
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
      <div className="bg-[#0F4C3A] rounded-xl p-2 flex flex-col items-center relative">
        {placedLetters.length > 0 &&
          !hasGapInWord() &&
          isWordConnectedToBoard() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitWord}
              style={getSubmitButtonPosition() || {}}
              className={cn(
                "absolute px-2 py-1 rounded-full text-xs font-medium shadow-lg z-10",
                "bg-yellow-400 text-yellow-900",
                "flex items-center gap-1 whitespace-nowrap",
                "transition-all duration-200 ease-in-out",
              )}>
              <span>Submit word</span>
              <span className="text-[10px]">↵</span>
            </motion.button>
          )}
        <div className="gap-0 grid grid-cols-10 grid-rows-10 w-[360px] h-[360px] bg-[#1A6B5A]/30 border-2 border-[#2A8B7A]">
          {Array.from({ length: 10 }, (_, rowIndex) =>
            Array.from({ length: 10 }, (_, colIndex) => {
              const letter = board[rowIndex][colIndex];
              const isPlaced = letterPlacers[`${rowIndex}-${colIndex}`];
              const isHighlighted = highlightedCells.some(
                (cell) =>
                  cell.row.toString() === rowIndex.toString() &&
                  cell.col.toString() === colIndex.toString(),
              );
              const isWordHighlight = wordCellsToHighlight.some(
                (cell) =>
                  cell.row.toString() === rowIndex.toString() &&
                  cell.col.toString() === colIndex.toString(),
              );
              const isPlacedThisTurn = placedLetters.some(
                (l) => l.row === rowIndex && l.col === colIndex,
              );
              return (
                <motion.div
                  key={`letter-${rowIndex}-${colIndex}`}
                  className={cn(
                    "flex items-center border-2 justify-center uppercase cursor-pointer relative border-[#1A6B5A]",
                    `${
                      isWordHighlight
                        ? "bg-[#FFFDEB] font-bold text-yellow-400 text-xl"
                        : letter &&
                            !placedLetters.some(
                              (l) => l.row === rowIndex && l.col === colIndex,
                            )
                          ? "bg-[#FFFDEB] font-bold text-[#B5A16E] text-xl"
                          : placedLetters.some(
                                (l) => l.row === rowIndex && l.col === colIndex,
                              )
                            ? "bg-yellow-400/30 text-yellow-400"
                            : validPlacementCells.some(
                                  (cell) =>
                                    cell.row === rowIndex &&
                                    cell.col === colIndex,
                                )
                              ? "bg-[#FFFDEB]/25 hover:bg-[#FFFDEB]/25"
                              : "bg-[#1A6B5A]/20"
                    } ${selectedLetter ? "hover:bg-[#FFFDEB]" : ""}`,
                    placedLetters.some(
                      (l) => l.row === rowIndex && l.col === colIndex,
                    )
                      ? "bg-yellow-400/30 text-yellow-400"
                      : "",
                  )}
                  style={{ width: 36, height: 36 }}
                  draggable={!!letter}
                  onDragStart={(e) =>
                    letter && handleDragStart(e as any, { letter, value: 1 }, 0)
                  }
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}>
                  {isWordHighlight && letter ? (
                    <div className="text-xl font-bold">{letter}</div>
                  ) : (
                    <motion.div
                      initial={{ scale: 1, color: "#B5A16E" }}
                      color="#B5A16E"
                      animate={
                        isHighlighted
                          ? {
                              scale: [1, 1.2, 1],
                              color: ["#B5A16E", "#EAB308", "#B5A16E"],
                              transition: {
                                duration: 1.5,
                                times: [0, 0.5, 1],
                                repeat: 0,
                              },
                            }
                          : {
                              color: "#B5A16E",
                            }
                      }
                      className="text-xl font-bold text-[#B5A16E]">
                      {letter}
                    </motion.div>
                  )}

                  {isPlaced && isPlaced.length > 0 && (
                    <div className="absolute bottom-0.5 left-0.5 flex -space-x-1">
                      {isPlaced
                        .filter((p) => p.fid !== user.fid)
                        .map((player, idx) => (
                          <div
                            key={player.fid}
                            className="w-3 h-3 rounded-full overflow-hidden">
                            <Image
                              src={formatAvatarUrl(player.avatarUrl || "")}
                              alt={player.displayName || player.username || ""}
                              width={24}
                              height={24}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </motion.div>
              );
            }),
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
                layout>
                <div
                  className={`w-10 h-10 bg-[#FFFDEB] border-2 border-[#E6E6E6] rounded-md uppercase flex flex-col items-center justify-center text-2xl font-bold text-[#B5A16E] shadow relative cursor-pointer ${
                    selectedLetter?.index === i ? "ring-2 ring-blue-400" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, l, i)}
                  onClick={() => handleLetterClick(l, i)}>
                  <span
                    className={`text-2xl text-[#B5A16E] font-bold uppercase ${
                      l.value >= 10 ? "mr-1" : ""
                    }`}>
                    {l.letter}
                  </span>
                  <span
                    className={`absolute text-xs text-[#B5A16E] font-medium uppercase bottom-0 right-0.5`}>
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
            className="w-10 h-10 bg-[#FFFDEB] border-2 border-[#E6E6E6] rounded-md flex items-center justify-center text-yellow-400 hover:bg-white/15 transition-colors shadow-sm">
            <ShuffleIcon className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Submit Button */}
        <div className="w-full max-w-md">
          <SquabbleButton
            text="Submit word"
            variant="primary"
            disabled={
              placedLetters.length === 0 ||
              hasGapInWord() ||
              !isWordConnectedToBoard()
            }
            onClick={handleSubmitWord}
          />
        </div>
      </div>
    </motion.div>
  );
}
