"use client";

import { useSocket } from "@/contexts/socket-context";
import { useSignIn } from "@/hooks/use-sign-in";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  AdjacentWordsNotValidEvent,
  GameEndedEvent,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { useAudio } from "@/contexts/audio-context";
import useFetchGame from "@/hooks/use-fetch-game";
import Ended from "./Ended";
import Live from "./Live";
import Loading from "./Loading";
import Lobby from "./Lobby";
import NoWallet from "./NoWallet";

export default function Game({ id }: { id: string }) {
  const { data: game } = useFetchGame(id);
  const { playSound } = useAudio();
  const { subscribe } = useSocket();
  const { connectToLobby, refreshAvailableLetters } = useSocketUtils();
  const [loadingTitle, setLoadingTitle] = useState("");
  const [loadingBody, setLoadingBody] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<
    Array<{ row: number; col: number }>
  >([]);
  const [highlightedWord, setHighlightedWord] = useState("");

  // where key is "x-y" position and value is player
  const [letterPlacers, setLetterPlacers] = useState<{
    [key: string]: Player[];
  }>({});
  const [board, setBoard] = useState<string[][]>([]);
  const [availableLetters, setAvailableLetters] = useState<
    { letter: string; value: number }[]
  >([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const {
    user,
    isSignedIn,
    isLoading: isSignInLoading,
  } = useSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      if (!user) {
        console.error("No user found");
        return;
      }
      if (players.find((p) => p.fid === user.fid)) {
        console.log("User already in game");
        return;
      }
      connectToLobby(
        {
          fid: user.fid,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl || "",
          ready: true,
        },
        id
      );
    },
  });

  const stakeAmount = game?.betAmount?.toString();

  useEffect(() => {
    subscribe("player_joined", (event: PlayerJoinedEvent) => {
      // TODO: add Toast with new player that joined
    });
    subscribe("game_update", (event: GameUpdateEvent) => {
      setPlayers(event.players);
    });
    subscribe("game_started", (event: GameStartedEvent) => {
      setGameState("live");
      setBoard(event.board);
      setTimeRemaining(event.timeRemaining);
    });
    subscribe(
      "refreshed_available_letters",
      (event: RefreshedAvailableLettersEvent) => {
        if (!user || (event.playerId && event.playerId !== user.fid)) return;
        const availableLetters = event.players.find(
          (p) => p.fid.toString() === user.fid.toString()
        )?.availableLetters;
        setAvailableLetters(availableLetters || []);
      }
    );
    subscribe("timer_tick", (event: TimerTickEvent) => {
      setTimeRemaining(event.timeRemaining);
    });
    subscribe("game_loading", (event: GameLoadingEvent) => {
      setGameState("loading");
      setLoadingTitle(event.title);
      setLoadingBody(event.body);
    });
    subscribe("game_ended", (event: GameEndedEvent) => {
      setGameState("ended");
      setPlayers(event.players);
    });
    subscribe("letter_placed", (event: LetterPlacedEvent) => {
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
    });
    subscribe("letter_removed", (event: LetterRemovedEvent) => {
      setLetterPlacers((prev) => {
        const newLetterPlacers = { ...prev };
        delete newLetterPlacers[`${event.position.x}-${event.position.y}`];
        return newLetterPlacers;
      });
    });
    subscribe("word_submitted", (event: WordSubmittedEvent) => {
      setBoard(event.board);
      setLetterPlacers((prev) => {
        const newLetterPlacers = { ...prev };
        console.log("newLetterPlacers", event.path);
        event.path.forEach((position) => {
          newLetterPlacers[`${position.y}-${position.x}`] = [];
        });
        return newLetterPlacers;
      });

      // Set the highlighted cells and word for all users
      setHighlightedCells(
        event.path.map((pos) => ({ row: pos.y, col: pos.x }))
      );
      setHighlightedWord(event.words.map((w) => w.toUpperCase()).join(", "));

      // Clear the highlight after animation
      setTimeout(() => {
        setHighlightedCells([]);
        setHighlightedWord("");
      }, 2000);

      playSound("wordSubmitted");

      // Show toast to all users
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
          duration: 3500,
          className:
            "bg-[#B5E9DA] border-2 border-[#C8EFE3] rounded-lg shadow-lg",
        }
      );
    });
    subscribe("word_not_valid", (event: WordNotValidEvent) => {
      setBoard(event.board);
      setLetterPlacers((prev) => {
        const newLetterPlacers = { ...prev };
        event.path.forEach((position) => {
          delete newLetterPlacers[`${position.y}-${position.x}`];
        });
        return newLetterPlacers;
      });
      refreshAvailableLetters(user?.fid!, id);
      if (event.player.fid === user?.fid) {
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
            duration: 1500,
          }
        );
      }
    });
    subscribe(
      "adjacent_words_not_valid",
      (event: AdjacentWordsNotValidEvent) => {
        setBoard(event.board);
        setLetterPlacers((prev) => {
          const newLetterPlacers = { ...prev };
          event.path.forEach((position) => {
            delete newLetterPlacers[`${position.y}-${position.x}`];
          });
          return newLetterPlacers;
        });
        refreshAvailableLetters(user?.fid!, id);
        if (event.player.fid === user?.fid) {
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
              duration: 1500,
            }
          );
        }
      }
    );
    subscribe("score_update", (event: ScoreUpdateEvent) => {
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
    });
  }, [subscribe, user]);

  const [gameState, setGameState] = useState<
    "lobby" | "live" | "loading" | "ended"
  >("lobby");
  const { address } = useAccount();
  if (!address) {
    return <NoWallet />;
  }

  if (!isSignedIn || isSignInLoading) {
    return <Loading title="Signing in..." body="" />;
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

  if (gameState === "ended") {
    return (
      <Ended
        players={players}
        user={user!}
        setGameState={setGameState}
        gameId={id}
      />
    );
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
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#B5E9DA] rounded-lg px-6 py-3 shadow-lg border-2 border-[#C8EFE3] z-50"
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
