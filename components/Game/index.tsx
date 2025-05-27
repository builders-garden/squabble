"use client";

import useSocketUtils from "@/hooks/use-socket-utils";
import { useEffect, useState } from "react";
import Lobby from "./Lobby";
import Live from "./Live";



export default function Game({ id }: { id: string }) {
  const { joinRoom } = useSocketUtils();
  const [gameState, setGameState] = useState<"lobby" | "live">("lobby");

  useEffect(() => {
    joinRoom(id, id);
  }, [id, joinRoom]);

  if (gameState === "lobby") {
    return <Lobby setGameState={setGameState} />;
  }

  return <Live setGameState={setGameState} />;
}
