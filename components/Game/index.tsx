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
import Live from "./Live";
import Lobby from "./Lobby";

export default function Game({ id }: { id: string }) {
  const { subscribe } = useSocket();
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

  useEffect(() => {
    subscribe("player_joined", (event: PlayerJoinedEvent) => {
      // TODO: add Toast with new player that joined
    });
    subscribe("game_update", (event: GameUpdateEvent) => {
      setPlayers(event.players);
    });
  }, []);

  const { connectToLobby } = useSocketUtils();
  const [gameState, setGameState] = useState<"lobby" | "live">("lobby");

  if (gameState === "lobby") {
    return <Lobby setGameState={setGameState} players={players} />;
  }

  return <Live setGameState={setGameState} />;
}
