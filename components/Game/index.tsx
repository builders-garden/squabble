"use client";

import { useSocket } from "@/contexts/socket-context";
import { useSignIn } from "@/hooks/use-sign-in";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  AdjacentWordsNotValidEvent,
  GameEndedEvent,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import useFetchGame from "@/hooks/use-fetch-game";
import Ended from "./Ended";
import Live from "./Live";
import Loading from "./Loading";
import Lobby from "./Lobby";

export default function Game({ id }: { id: string }) {
  const { data: game } = useFetchGame(id);
  const { subscribe } = useSocket();
  const { connectToLobby, refreshAvailableLetters } = useSocketUtils();
  const [players, setPlayers] = useState<Player[]>([]);

  // where key is "x-y" position and value is player
  const [letterPlacers, setLetterPlacers] = useState<{
    [key: string]: Player[];
  }>({});
  const [board, setBoard] = useState<string[][]>([]);
  const [availableLetters, setAvailableLetters] = useState<
    { letter: string; value: number }[]
  >([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const { user } = useSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      if (!user) return;
      if (players.find((p) => p.fid === user.fid)) return;
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
        event.path.forEach((position) => {
          delete newLetterPlacers[`${position.x}-${position.y}`];
        });
        return newLetterPlacers;
      });
      if (event.player.fid === user?.fid) {
        toast.success(
            `"${event.words.map((w) => w.toUpperCase()).join(", ")}" ${event.words.length > 1 ? "are valid words" : "is a valid word"}! (+${event.score} points)`,
          {
            position: "top-center",
          }
        );
      }
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
        toast.error(`"${event.word.toUpperCase()}" is not a valid word!`, {
          position: "top-center",
        });
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
          toast.error(`"${event.word.toUpperCase()}" is valid but adjacent words are not!`, {
            position: "top-center",
          });
        }
      }
    );
    subscribe("score_update", (event: ScoreUpdateEvent) => {
      setPlayers((prev) => {
        const newPlayers = [...prev];
        const playerIndex = newPlayers.findIndex((p) => p.fid === event.player.fid);
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
    return <div>No wallet connected</div>;
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
    return <Loading />;
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
    />
  );
}
