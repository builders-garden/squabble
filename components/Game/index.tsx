"use client";

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
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { useAudio } from "@/contexts/audio-context";
import { GameProvider, useGame } from "@/contexts/game-context";
import { useFakeSignIn } from "@/hooks/use-fake-sign-in";
import useFetchGame from "@/hooks/use-fetch-game";
import { useSignIn } from "@/hooks/use-sign-in";
import { GameStatus } from "@prisma/client";
import Ended from "./Ended";
import GameFull from "./GameFull";
import GameStarted from "./GameStarted";
import Live from "./Live";
import Loading from "./Loading";
import Lobby from "./Lobby";
import NoWallet from "./NoWallet";
import SignIn from "./SignIn";

// Create a ref to track processed events
const processedEvents = new Set<string>();

// Custom hook for socket events
function useGameEvents(id: string, user: any, refetchGame: () => Promise<any>) {
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
        refetchGame().then(() => {
          setGameState("ended");
          setPlayers(event.players);
        });
      },
      letter_placed: (event: LetterPlacedEvent) => {
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          const key = `${event.position.x}-${event.position.y}`;
          const existingPlacers = newLetterPlacers[key] || [];

          // Only add player if they haven't already placed on this cell
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
        // Create a unique event ID based on timestamp and word
        const eventId = `${event.gameId}-${event.words.join()}-${Date.now()}`;

        // Skip if we've already processed this event
        if (processedEvents.has(eventId)) {
          return;
        }
        processedEvents.add(eventId);

        // Clear old events from the Set after 5 seconds
        setTimeout(() => {
          processedEvents.delete(eventId);
        }, 5000);

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
            <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-lg animate-bounce">
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
            className:
              "bg-white/15 border-2 border-[#C8EFE3] rounded-lg shadow-lg",
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
          refreshAvailableLetters(user?.fid!, id);
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
          refreshAvailableLetters(user?.fid!, id);
          playSound("wordNotValid");
          toast.custom(
            (t) => (
              <div className="w-fit flex items-center gap-2 p-2 bg-white  rounded-lg shadow animate-shake">
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
  }, [subscribe, unsubscribe, user, playSound, refreshAvailableLetters, id]);

  return {
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
    setBoard,
    setPlayers,
    setGameState,
    setHighlightedCells,
    setHighlightedWord,
    setLetterPlacers,
    setAvailableLetters,
    setTimeRemaining,
  };
}

function GameContent({ id }: { id: string }) {
  const { data: game, refetch: refetchGame } = useFetchGame(id);
  const { address } = useAccount();
  const hasConnectedToLobby = useRef(false);
  const { user, isSignedIn, isSignInLoading, signIn } = useGame();

  // Reset the connection flag when game ID changes or component unmounts
  useEffect(() => {
    hasConnectedToLobby.current = false;

    return () => {
      hasConnectedToLobby.current = false;
    };
  }, [id]);

  const {
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
    setBoard,
    setAvailableLetters,
    setTimeRemaining,
    setGameState,
  } = useGame();

  const stakeAmount = game?.betAmount?.toString();

  if (game?.status === GameStatus.FINISHED || gameState === "ended") {
    return (
      <Ended players={players} game={game!} />
    );
  }

  if (gameState === "full") {
    return <GameFull />;
  }

  if (game?.status === GameStatus.PLAYING) {
    return <GameStarted />;
  }

  if (!address) {
    return <NoWallet />;
  }

  if (isSignInLoading) {
    return <Loading title="Signing in..." body="" />;
  }

  if (!isSignedIn) {
    return <SignIn signIn={signIn} />;
  }

  if (gameState === "lobby") {
    return (
      <Lobby
        setGameState={setGameState}
        players={players}
        gameLeaderFid={4461}
        currentUser={user || null}
        userAddress={address as `0x${string}`}
        gameId={id}
        contractGameId={game?.contractGameId?.toString()!}
        stakeAmount={stakeAmount!}
      />
    );
  }

  if (gameState === "loading") {
    return <Loading title={loadingTitle} body={loadingBody} />;
  }

  return (
    <>
      <AnimatePresence>
        {highlightedWord && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.8,
              transition: {
                duration: 0.2,
              },
            }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/15 rounded-lg px-6 py-3 shadow-lg border-2 border-[#C8EFE3] z-50"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{
                scale: 1,
                rotate: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                },
              }}
              className="text-xl font-bold text-white flex items-center gap-2"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  transition: {
                    delay: 0.1,
                    type: "spring",
                    stiffness: 300,
                  },
                }}
                className="text-[#7B5A2E]"
              >
                ✓
              </motion.span>
              {highlightedWord}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Live
        user={user!}
        gameId={id}
        board={board}
        timeRemaining={timeRemaining}
        availableLetters={availableLetters}
        setAvailableLetters={setAvailableLetters}
        setBoard={setBoard}
        setTimeRemaining={setTimeRemaining}
        letterPlacers={letterPlacers}
        players={players}
        highlightedCells={highlightedCells}
      />
    </>
  );
}

export default function GamePage({ id }: { id: string }) {
  return (
    <GameProvider gameId={id}>
      <GameContent id={id} />
    </GameProvider>
  );
}
