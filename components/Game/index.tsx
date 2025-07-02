"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

import { GameProvider, useGame } from "@/contexts/game-context";
import { SocketProvider } from "@/contexts/socket-context";
import useFetchGame from "@/hooks/use-fetch-game";
import { GameStatus } from "@prisma/client";
import Ended from "./Ended";
import GameFull from "./GameFull";
import GameStarted from "./GameStarted";
import Live from "./Live";
import Loading from "./Loading";
import Lobby from "./Lobby";
import NoWallet from "./NoWallet";
import SignIn from "./SignIn";
import Tutorial from "./Tutorial";

function GameContent({ id }: { id: string }) {
  const { data: game, refetch: refetchGame } = useFetchGame(id);
  const { address } = useAccount();
  const hasConnectedToLobby = useRef(false);
  const { user, isSignedIn, isSignInLoading, signIn } = useGame();

  useEffect(() => {
    if (game?.status === GameStatus.PLAYING) {
      setGameState("live");
    } else if (game?.status === GameStatus.FINISHED) {
      setGameState("ended");
    }
    if (
      game?.participants.length === 6 &&
      !game?.participants.some((p) => p.fid.toString() === user?.fid.toString())
    ) {
      setGameState("full");
    }
  }, [game]);

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

  if (!address) {
    return <NoWallet />;
  }

  if (isSignInLoading) {
    return <Loading title="Signing in..." body="" />;
  }

  if (!isSignedIn && !isSignInLoading) {
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
    if (loadingTitle === "Starting game") {
      return <Tutorial />;
    }
    return <Loading title={loadingTitle} body={loadingBody} />;
  }

  if (game?.status === GameStatus.FINISHED || gameState === "ended") {
    return <Ended players={players} game={game!} refetchGame={refetchGame} />;
  }

  if (
    (gameState === "full" ||
      players.length === 6 ||
      game?.participants?.length === 6) &&
    !game?.participants?.some((p) => p.fid.toString() === user?.fid.toString())
  ) {
    return <GameFull />;
  }

  if (
    game?.status === GameStatus.PLAYING &&
    !game.participants.some(
      (p) => p.fid.toString() === user?.fid.toString() && p.joined === true
    )
  ) {
    return <GameStarted />;
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
    <SocketProvider>
      <GameProvider gameId={id}>
        <GameContent id={id} />
      </GameProvider>
    </SocketProvider>
  );
}
