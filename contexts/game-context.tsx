"use client";

import { useAudio } from "@/contexts/audio-context";
import { useSocket } from "@/contexts/socket-context";
import { useFakeSignIn } from "@/hooks/use-fake-sign-in";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  AdjacentWordsNotValidEvent,
  GameEndedEvent,
  GameFullEvent,
  GameLoadingEvent,
  GameStartedEvent,
  GameUpdateEvent,
  LetterPlacedEvent,
  LetterRemovedEvent,
  Player,
  PlayerJoinedEvent,
  RefreshedAvailableLettersEvent,
  ScoreUpdateEvent,
  TimerTickEvent,
  WordNotValidEvent,
  WordSubmittedEvent,
} from "@/types/socket-events";
import { User } from "@prisma/client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

interface GameContextType {
  board: string[][];
  players: Player[];
  gameState: "lobby" | "live" | "loading" | "ended" | "full";
  loadingTitle: string;
  loadingBody: string;
  highlightedCells: Array<{ row: number; col: number }>;
  highlightedWord: string;
  letterPlacers: { [key: string]: Player[] };
  availableLetters: { letter: string; value: number }[];
  timeRemaining: number;
  user: User | undefined;
  isSignedIn: boolean;
  isSignInLoading: boolean;
  signIn: () => void;
  setBoard: (board: string[][]) => void;
  setPlayers: (players: Player[]) => void;
  setGameState: (
    state: "lobby" | "live" | "loading" | "ended" | "full"
  ) => void;
  setHighlightedCells: (cells: Array<{ row: number; col: number }>) => void;
  setHighlightedWord: (word: string) => void;
  setLetterPlacers: (placers: { [key: string]: Player[] }) => void;
  setAvailableLetters: (letters: { letter: string; value: number }[]) => void;
  setTimeRemaining: (time: number) => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Create a ref to track processed events
const processedEvents = new Set<string>();

export function GameProvider({
  children,
  gameId,
}: {
  children: React.ReactNode;
  gameId: string;
}) {
  const { subscribe, unsubscribe } = useSocket();
  const { playSound } = useAudio();
  const { refreshAvailableLetters } = useSocketUtils();

  const [board, setBoard] = useState<string[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<
    "lobby" | "live" | "loading" | "ended" | "full"
  >("lobby");
  const [loadingTitle, setLoadingTitle] = useState("");
  const [loadingBody, setLoadingBody] = useState("");
  const [highlightedCells, setHighlightedCells] = useState<
    Array<{ row: number; col: number }>
  >([]);
  const [highlightedWord, setHighlightedWord] = useState("");
  const [letterPlacers, setLetterPlacers] = useState<{
    [key: string]: Player[];
  }>({});
  const [availableLetters, setAvailableLetters] = useState<
    { letter: string; value: number }[]
  >([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const { address } = useAccount();
  const { connectToLobby } = useSocketUtils();
  const hasConnectedToLobby = useRef(false);
  const { user, isSignedIn, isLoading:isSignInLoading, signIn } = useFakeSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      if (!user) {
        console.error("No user found");
        return;
      }

      // Check if user is already in the game
      if (players.find((p) => p.fid.toString() === user.fid.toString())) {
        console.log("User already in game");
        return;
      }

      // // Check if we've already connected to lobby for this user
      // if (hasConnectedToLobby.current) {
      //   console.log("Already connected to lobby");
      //   return;
      // }

      hasConnectedToLobby.current = true;
      connectToLobby(
        {
          fid: user.fid,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl || "",
          address: address as `0x${string}`,
        },
        gameId
      );
    },
  });

  useEffect(() => {
    const eventHandlers = {
      player_joined: (event: PlayerJoinedEvent) => {
        // TODO: add Toast with new player that joined
      },
      game_full: (event: GameFullEvent) => {
        setGameState("full");
      },
      game_update: (event: GameUpdateEvent) => {
        setPlayers(event.players);
      },
      game_started: (event: GameStartedEvent) => {
        setGameState("live");
        setBoard(event.board);
        setTimeRemaining(event.timeRemaining);
      },
      refreshed_available_letters: (event: RefreshedAvailableLettersEvent) => {
        if (!user || (event.playerId && event.playerId !== user.fid)) return;
        const availableLetters = event.players.find(
          (p) => p.fid.toString() === user.fid.toString()
        )?.availableLetters;
        setAvailableLetters(availableLetters || []);
      },
      timer_tick: (event: TimerTickEvent) => {
        setTimeRemaining(event.timeRemaining);
      },
      game_loading: (event: GameLoadingEvent) => {
        setGameState("loading");
        setLoadingTitle(event.title);
        setLoadingBody(event.body);
      },
      game_ended: (event: GameEndedEvent) => {
        setGameState("ended");
        setPlayers(event.players);
      },
      letter_placed: (event: LetterPlacedEvent) => {
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          const key = `${event.position.x}-${event.position.y}`;
          const existingPlacers = newLetterPlacers[key] || [];

          if (!existingPlacers.find((p) => p.fid === event.player.fid)) {
            newLetterPlacers[key] = [...existingPlacers, event.player];
          }

          return newLetterPlacers;
        });
      },
      letter_removed: (event: LetterRemovedEvent) => {
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          delete newLetterPlacers[`${event.position.x}-${event.position.y}`];
          return newLetterPlacers;
        });
      },
      word_submitted: (event: WordSubmittedEvent) => {
        const eventId = `${event.gameId}-${event.words.join()}-${Date.now()}`;
        if (processedEvents.has(eventId)) return;
        processedEvents.add(eventId);
        setTimeout(() => processedEvents.delete(eventId), 5000);

        setBoard(event.board);
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          event.path.forEach((position) => {
            newLetterPlacers[`${position.y}-${position.x}`] = [];
          });
          return newLetterPlacers;
        });

        setHighlightedCells(
          event.path.map((pos) => ({ row: pos.y, col: pos.x }))
        );
        setHighlightedWord(event.words.map((w) => w.toUpperCase()).join(", "));

        setTimeout(() => {
          setHighlightedCells([]);
          setHighlightedWord("");
        }, 2000);

        playSound("wordSubmitted");

        toast.custom(
          (id) => (
            <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-lg animate-bounce border-2 border-[#C8EFE3]">
              <img
                src={require("@/lib/utils").formatAvatarUrl(
                  event.player.avatarUrl || ""
                )}
                alt={event.player.displayName || event.player.username || ""}
                className="w-12 h-12 rounded-full border-4 border-[#C8EFE3] object-cover shadow-sm"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xl text-[#7B5A2E]">
                  {event.words.map((w) => w.toUpperCase()).join(", ")}
                </span>
                <span className="text-base text-[#B5A16E] font-semibold">
                  +{event.score} points
                </span>
              </div>
            </div>
          ),
          {
            position: "top-center",
            duration: 5000,
            className: "!p-0",
          }
        );
      },
      word_not_valid: (event: WordNotValidEvent) => {
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          event.path.forEach((position) => {
            newLetterPlacers[`${position.y}-${position.x}`] =
              newLetterPlacers[`${position.y}-${position.x}`]?.filter(
                (p) => p.fid !== event.player.fid
              ) || [];
          });
          return newLetterPlacers;
        });
        if (event.player.fid === user?.fid) {
          setBoard(event.board);
          refreshAvailableLetters(user?.fid!, gameId);
          playSound("wordNotValid");
          toast.custom(
            (t) => (
              <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow animate-shake">
                <div className="text-red-600 font-medium text-sm">
                  ❌ &quot;{event.word.toUpperCase()}&quot; is not a valid word!
                  🚫
                </div>
              </div>
            ),
            {
              position: "top-left",
              duration: 5000,
            }
          );
        }
      },
      adjacent_words_not_valid: (event: AdjacentWordsNotValidEvent) => {
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          event.path.forEach((position) => {
            newLetterPlacers[`${position.y}-${position.x}`] =
              newLetterPlacers[`${position.y}-${position.x}`]?.filter(
                (p) => p.fid !== event.player.fid
              ) || [];
          });
          return newLetterPlacers;
        });
        if (event.player.fid === user?.fid) {
          setBoard(event.board);
          refreshAvailableLetters(user?.fid!, gameId);
          playSound("wordNotValid");
          toast.custom(
            (t) => (
              <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow animate-shake">
                <div className="text-red-600 font-medium text-sm">
                  ❌ &quot;{event.word.toUpperCase()}&quot; is valid but
                  adjacent words are not! 🚫
                </div>
              </div>
            ),
            {
              position: "top-left",
              duration: 5000,
            }
          );
        }
      },
      score_update: (event: ScoreUpdateEvent) => {
        setPlayers((prev) => {
          const newPlayers = [...prev];
          const playerIndex = newPlayers.findIndex(
            (p) => p.fid === event.player.fid
          );
          if (playerIndex !== -1) {
            newPlayers[playerIndex].score = event.newScore;
          }
          return newPlayers;
        });
      },
    };

    // Subscribe to all events
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      subscribe(event as any, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        unsubscribe(event as any, handler);
      });
    };
  }, [
    subscribe,
    unsubscribe,
    user,
    playSound,
    refreshAvailableLetters,
    gameId,
  ]);

  return (
    <GameContext.Provider
      value={{
        board,
        players,
        gameState,
        loadingTitle,
        loadingBody,
        highlightedCells,
        highlightedWord,
        letterPlacers,
        availableLetters,
        timeRemaining,
        isSignedIn,
        isSignInLoading,
        user,
        signIn,
        setBoard,
        setPlayers,
        setGameState,
        setHighlightedCells,
        setHighlightedWord,
        setLetterPlacers,
        setAvailableLetters,
        setTimeRemaining,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
