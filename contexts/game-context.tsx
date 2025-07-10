"use client";

import { useAudio } from "@/contexts/audio-context";
import { useSocket } from "@/contexts/socket-context";
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
import { useRegisteredUser } from "./user-context";

interface GameContextType {
  board: string[][];
  players: Player[];
  currentPlayer: Player | undefined;
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
  const [currentPlayer, setCurrentPlayer] = useState<Player | undefined>();
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
  const { user, isSigningIn, signIn } = useRegisteredUser();

  const handleConnectToLobby = async () => {
    hasConnectedToLobby.current = true;
    connectToLobby(
      {
        fid: user?.data?.fid!,
        displayName: user?.data?.displayName,
        username: user?.data?.username,
        avatarUrl: user?.data?.avatarUrl || "",
        address: address as `0x${string}`,
      },
      gameId
    );
  };

  useEffect(() => {
    if (user?.data) {
      // Check if user is already in the game
      if (
        players.find((p) => p.fid.toString() === user?.data?.fid.toString())
      ) {
        console.log("User already in game");
        return;
      }

      handleConnectToLobby();
    }
  }, [user?.data]);

  useEffect(() => {
    if (
      !players.find((p) => p?.fid?.toString() === user?.data?.fid.toString()) &&
      players.length < 6
    ) {
      handleConnectToLobby();
    }
  }, [players]);

  useEffect(() => {
    const eventHandlers = {
      player_joined: (event: PlayerJoinedEvent) => {
        // TODO: add Toast with new player that joined
      },
      game_full: (event: GameFullEvent) => {
        if (
          !players.find((p) => p.fid.toString() === user?.data?.fid.toString())
        ) {
          setGameState("full");
        }
      },
      game_update: (event: GameUpdateEvent) => {
        console.log("RECEIVED game_update", event.players);
        setPlayers(event.players.filter((p) => p.fid));
      },
      game_started: (event: GameStartedEvent) => {
        setGameState("live");
        setBoard(event.board);
        setTimeRemaining(event.timeRemaining);
      },
      refreshed_available_letters: (event: RefreshedAvailableLettersEvent) => {
        if (!user?.data || (event.playerId && event.playerId !== user.data.fid))
          return;
        const availableLetters = event.players.find(
          (p) => p.fid.toString() === user?.data?.fid.toString()
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
        setPlayers(event.players.filter((p) => p.fid));
        setGameState("ended");
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
          // Clear all letter placers for this player
          Object.keys(newLetterPlacers).forEach((key) => {
            newLetterPlacers[key] =
              newLetterPlacers[key]?.filter(
                (p) => p.fid !== event.player.fid
              ) || [];
          });
          // Clear all players' letter placers from the submitted word path
          event.path.forEach((position) => {
            const key = `${position.y}-${position.x}`;
            delete newLetterPlacers[key];
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
          // Clear all letter placers for this player
          Object.keys(newLetterPlacers).forEach((key) => {
            newLetterPlacers[key] =
              newLetterPlacers[key]?.filter(
                (p) => p.fid !== event.player.fid
              ) || [];
          });
          return newLetterPlacers;
        });
        if (event.player.fid === user?.data?.fid) {
          setBoard(event.board);
          refreshAvailableLetters(user?.data?.fid!, gameId);
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
        if (event.player.fid === user?.data?.fid) {
          setBoard(event.board);
          refreshAvailableLetters(user?.data?.fid!, gameId);
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
          return newPlayers.filter((p) => p.fid);
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

  // Keep currentPlayer in sync with players array and user FID
  useEffect(() => {
    const userData = user?.data;
    if (userData && players.length > 0) {
      const player = players.find(
        (p) => p.fid.toString() === userData.fid.toString()
      );
      setCurrentPlayer(player);
    } else {
      setCurrentPlayer(undefined);
    }
  }, [players, user?.data?.fid]);

  return (
    <GameContext.Provider
      value={{
        board,
        players,
        currentPlayer,
        gameState,
        loadingTitle,
        loadingBody,
        highlightedCells,
        highlightedWord,
        letterPlacers,
        availableLetters,
        timeRemaining,
        isSignedIn: !!user?.data,
        isSignInLoading: isSigningIn,
        user: user?.data,
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
