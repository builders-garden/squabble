"use client";

import { useSocket } from "@/contexts/socket-context";
import { useSignIn } from "@/hooks/use-sign-in";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  GameUpdateEvent,
  Player,
  PlayerJoinedEvent,
} from "@/types/socket-events";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import Live from "./Live";
import Lobby from "./Lobby";
import useFetchGame from "@/hooks/use-fetch-game";

export default function Game({ id }: { id: string }) {
  const { data: game } = useFetchGame(id);
  const { subscribe } = useSocket();
  const { connectToLobby } = useSocketUtils();
  const [players, setPlayers] = useState<Player[]>([]);
  const { user } = useSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      connectToLobby(
        {
          fid: user.fid,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl || "",
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
  }, []);

  const [gameState, setGameState] = useState<"lobby" | "live">("lobby");
  const { address } = useAccount();
  if (gameState === "lobby") {
    return (
      (
      <Lobby
        setGameState={setGameState}
        players={players}
        gameLeaderFid={4461}
        currentUser={user}
        userAddress={address as `0x${string}`}
        gameId={id}
        stakeAmount={stakeAmount!}
      />
    )
    );
  }

  return <Live setGameState={setGameState} />;
}
