"use client";

import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { GameStatus } from "@prisma/client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { GameProvider, useGame } from "@/contexts/game-context";
import { useMiniAppWallet } from "@/contexts/miniapp-wallet-context";
import { SocketProvider } from "@/contexts/socket-context";
import useFetchGame from "@/hooks/use-fetch-game";
import { useMiniApp } from "@/hooks/use-miniapp";
import { useSignIn } from "@/hooks/use-sign-in";
import { useUser } from "@/hooks/use-user";
import Ended from "./Ended";
import GameFull from "./GameFull";
import GameStarted from "./GameStarted";
import GameWebsite from "./GameWebsite";
import Live from "./Live";
import Loading from "./Loading";
import Lobby from "./Lobby";
import SignIn from "./SignIn";
import Splash from "./Splash";
import Tutorial from "./Tutorial";

function GameContent({ id }: { id: string }) {
  const { context, isMiniAppReady } = useMiniApp();
  const { data: game, refetch: refetchGame } = useFetchGame(id);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { isCoinbaseWallet } = useMiniAppWallet();
  const hasConnectedToLobby = useRef(false);
  const { user } = useUser();
  const {
    isSignedIn,
    isLoading: isSignInLoading,
    error: signInError,
    signIn,
  } = useSignIn({});

  useEffect(() => {
    if (!isConnected) {
      console.log("connecting wallet");
      if (isCoinbaseWallet) {
        connect({
          connector: coinbaseWallet({
            appName: "Squabble",
          }),
        });
      } else if (context) {
        connect({ connector: miniAppConnector() });
      }
    }
  }, [isConnected, context, isCoinbaseWallet, connect]);

  useEffect(() => {
    if (game?.status === GameStatus.FINISHED) {
      setGameState("ended");
    } else if (game?.participants && game.participants.length === 6 && user) {
      const foundUser = game.participants.some(
        (p) => p.fid.toString() === user.fid.toString(),
      );
      if (!foundUser) {
        setGameState("full");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, user]);

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

  console.log('gameState === "full":', gameState === "full");
  console.log("players.length >= 2:", players.length >= 2);
  console.log(
    "game?.participants?.length === 2:",
    game?.participants?.length === 2,
  );
  console.log(
    "!game?.participants?.some(p => p?.fid?.toString() === user?.fid?.toString()):",
    !game?.participants?.some(
      (p) => p?.fid?.toString() === user?.fid?.toString(),
    ),
  );
  console.log("game?.participants:", game?.participants);
  console.log(
    "Combined condition:",
    (gameState === "full" ||
      players.length >= 2 ||
      game?.participants?.length === 2) &&
      !game?.participants?.some(
        (p) => p?.fid?.toString() === user?.fid?.toString(),
      ),
  );

  // if we arent in a miniapp, show the website and redirect to a farcaster client
  if (!context || !isMiniAppReady) {
    return <GameWebsite gameId={id} />;
  }

  return (
    <AnimatePresence mode="wait">
      {!isSignedIn ? (
        isSignInLoading ? (
          <Loading key="loading-signin" title="Signing in..." body="" />
        ) : signInError ? (
          <SignIn key="signin" signIn={signIn} />
        ) : (
          <Splash key="splash" />
        )
      ) : game?.status === GameStatus.FINISHED || gameState === "ended" ? (
        <Ended
          key="ended"
          players={players}
          game={game!}
          refetchGame={refetchGame}
        />
      ) : (gameState === "full" ||
          players.length >= 6 ||
          game?.participants?.length === 6) &&
        !game?.participants?.some(
          (p) => p?.fid?.toString() === user?.fid?.toString(),
        ) &&
        !players.some((p) => p?.fid?.toString() === user?.fid?.toString()) ? (
        <GameFull key="game-full" />
      ) : game?.status === GameStatus.PLAYING &&
        !game.participants.some(
          (p) => p.fid.toString() === user?.fid.toString() && p.joined === true,
        ) ? (
        <GameStarted key="game-started" />
      ) : gameState === "lobby" ? (
        <Lobby
          key="lobby"
          setGameState={setGameState}
          players={players}
          gameLeaderFid={4461}
          currentUser={user || null}
          userAddress={address as `0x${string}`}
          gameId={id}
          contractGameId={game?.contractGameId?.toString()!}
          stakeAmount={stakeAmount!}
        />
      ) : gameState === "loading" ? (
        loadingTitle === "Starting game" ? (
          <Tutorial key="tutorial" />
        ) : (
          <Loading key="loading-game" title={loadingTitle} body={loadingBody} />
        )
      ) : (
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
                className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/15 rounded-lg px-6 py-3 shadow-lg border-2 border-[#C8EFE3] z-50">
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
                  className="text-xl font-bold text-white flex items-center gap-2">
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
                    className="text-[#7B5A2E]">
                    ✓
                  </motion.span>
                  {highlightedWord}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {user && (
            <Live
              key="live"
              user={user}
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
          )}
        </>
      )}
    </AnimatePresence>
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
