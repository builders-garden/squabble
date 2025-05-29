"use client";

import { useSocket } from "@/contexts/socket-context";
import { useSignIn } from "@/hooks/use-sign-in";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  GameStartedEvent,
  GameUpdateEvent,
  Player,
  PlayerJoinedEvent,
  RefreshedAvailableLettersEvent,
} from "@/types/socket-events";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import useFetchGame from "@/hooks/use-fetch-game";
import Live from "./Live";
import Loading from "./Loading";
import Lobby from "./Lobby";

export default function Game({ id }: { id: string }) {
  const { data: game } = useFetchGame(id);
  const { subscribe } = useSocket();
  const { connectToLobby } = useSocketUtils();
  const [players, setPlayers] = useState<Player[]>([]);

  const [board, setBoard] = useState<string[][]>([]);
  const [availableLetters, setAvailableLetters] = useState<
    { letter: string; value: number }[]
  >([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const { user } = useSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      connectToLobby(
        {
          fid: user.fid,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl || "",
          // ready: true,
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
  }, [subscribe, user]);

  const [gameState, setGameState] = useState<"lobby" | "live" | "loading">(
    "lobby"
  );
  const { address } = useAccount();
  console.log(address, "address");
  if (!address) {
    return <div>No wallet connected</div>;
  }
  if (gameState === "lobby") {
    return (
      <Lobby
        setGameState={setGameState}
        players={players}
        gameLeaderFid={4461}
        currentUser={user}
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
    />
  );
}
