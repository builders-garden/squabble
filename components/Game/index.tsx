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

import useFetchGame from "@/hooks/use-fetch-game";
import Live from "./Live";
import Lobby from "./Lobby";

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
  }, [subscribe]);

  const [gameState, setGameState] = useState<"lobby" | "live">("lobby");
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

  return <Live setGameState={setGameState} />;
}
