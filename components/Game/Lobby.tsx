"use client";

import { DaimoPayButton } from "@daimo/pay";
import { PaymentCompletedEvent } from "@daimo/pay-common";
import { User } from "@prisma/client";
import { CheckCircleIcon, ClockIcon, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { basePreconf } from "viem/chains";
import { useAccount, useCapabilities, useSendCalls } from "wagmi";
import Chip from "@/components/ui/chip";
import LobbyPlayerCard from "@/components/ui/lobby-player-card";
import LobbySpotAvailableCard from "@/components/ui/lobby-spot-available-card";
import ShareButton from "@/components/ui/share-button";
import SquabbleButton from "@/components/ui/squabble-button";
import { useAudio } from "@/contexts/audio-context";
import { useGame } from "@/contexts/game-context";
import { useMiniApp } from "@/hooks/use-miniapp";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  FARCASTER_CLIENT_FID,
  SQUABBLE_CONTRACT_ABI,
  SQUABBLE_CONTRACT_ADDRESS,
} from "@/lib/constants";
import { joinGameCalldata } from "@/lib/daimo";
import { env } from "@/lib/env";
import { trackEvent } from "@/lib/posthog/client";
import { formatAvatarUrl } from "@/lib/utils";
import { Player } from "@/types/socket";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Lobby({
  setGameState,
  gameLeaderFid,
  players,
  currentUser,
  userAddress,
  gameId,
  contractGameId,
  stakeAmount,
}: {
  setGameState: (state: "lobby" | "loading" | "live") => void;
  gameLeaderFid: number;
  players: Player[];
  currentUser: User | null;
  userAddress: string;
  gameId: string;
  contractGameId: string;
  stakeAmount: string;
}) {
  const { isMusicPlaying, toggleMusic } = useAudio();
  const {
    playerStakeConfirmed,
    startGame,
    playerStakeRefunded,
    connectToLobby,
  } = useSocketUtils();
  const {
    sendCalls,
    data: callsHash,
    error: callsError,
    isPending: areCallsPending,
  } = useSendCalls({
    mutation: {
      onSuccess: (data) => {
        console.log("callsHash", data);
      },
    },
  });
  const [isRefunding, setIsRefunding] = useState(false);
  const { address } = useAccount();
  const { context } = useMiniApp();

  // Check for paymaster capabilities with `useCapabilities`
  const { data: availableCapabilities, isLoading: areCapabilitiesLoading } =
    useCapabilities({
      account: address,
    });
  const capabilities = useMemo(() => {
    if (!availableCapabilities || !address) return {};
    const capabilitiesForChain = availableCapabilities[basePreconf.id];
    if (
      capabilitiesForChain &&
      capabilitiesForChain["paymasterService"] &&
      capabilitiesForChain["paymasterService"]?.supported
    ) {
      return {
        paymasterService: {
          url: `https://api.developer.coinbase.com/rpc/v1/base/DHt48UwD1CwX5JiCIApOYkd6C7zv2Cxt`, // Using Next.js rewrite to proxy the request
        },
      };
    }
    return {};
  }, [availableCapabilities, address]);

  // Find current user in players list to check their status
  const { currentPlayer } = useGame();
  const isCurrentUserPending = currentPlayer && !currentPlayer.ready;

  const handlePaymentCompleted = (event: PaymentCompletedEvent) => {
    console.log("Payment completed:", event);
    if (currentUser && event.txHash) {
      // Emit socket event to confirm stake payment
      playerStakeConfirmed({
        player: {
          fid: currentUser.fid,
          displayName: currentUser.displayName,
          username: currentUser.username,
          avatarUrl: formatAvatarUrl(currentUser.avatarUrl || ""),
          address: address!,
        },
        gameId,
        paymentHash: event.txHash as string,
        payerAddress: event.payment.source?.payerAddress as string,
      });
    }
  };

  const handleStartGame = () => {
    if (!currentPlayer) {
      console.warn("Cannot handle start game: No current player found");
      return;
    }
    setGameState("loading");
    startGame({ player: currentPlayer, gameId });
    trackEvent("game_started", {
      gameId,
      stakeAmount: stakeAmount,
      fid: currentPlayer.fid,
      players: players.length,
    });
  };

  const handleGetStakeBack = async () => {
    // onchain call to get stake back using wagmi
    try {
      setIsRefunding(true);
      console.log("capabilities", capabilities);
      const calls = await sendCalls({
        calls: [
          {
            to: SQUABBLE_CONTRACT_ADDRESS as `0x${string}`,
            abi: SQUABBLE_CONTRACT_ABI,
            functionName: "withdrawFromGame",
            args: [BigInt(contractGameId)],
          },
        ],
        capabilities,
      });
      console.log("calls", calls);
    } catch (error) {
      console.error(error);
      toast.custom(
        (t) => (
          <div className="w-fit flex items-center gap-2 p-2 bg-white  rounded-lg shadow animate-shake">
            <div className="text-red-600 font-medium text-sm">
              ❌ Failed to get buy-in back. Please try again.
            </div>
          </div>
        ),
        {
          position: "top-left",
          duration: 5000,
        },
      );
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    if (currentPlayer && callsHash) {
      console.log("found callsHash", callsHash);
      playerStakeRefunded({
        player: currentPlayer,
        gameId,
        transactionHash: "txHash", // TODO: get from callsHash
      });
      toast.custom(
        (t) => (
          <div className="w-fit flex items-center gap-2 p-2 bg-white  rounded-lg shadow animate-shake">
            <div className="text-green-600 font-medium text-sm">
              ✅ Buy-in refunded.
            </div>
          </div>
        ),
        {
          position: "top-left",
          duration: 5000,
        },
      );
      setIsRefunding(false);
    }
  }, [callsHash]);

  const pendingStakes = players.filter((p) => !p.ready).length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-between p-4">
      {/* Mute Button */}
      <button
        onClick={toggleMusic}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label={isMusicPlaying ? "Mute music" : "Unmute music"}>
        {isMusicPlaying ? (
          <Volume2 size={16} color="white" />
        ) : (
          <VolumeX size={16} color="white" />
        )}
      </button>

      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-row items-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[80px] pb-2"
            width={80}
            height={80}
          />
          <div
            className={`${luckiestGuy.className} text-4xl text-white tracking-wider`}>
            SQUABBLE
          </div>
        </div>
        <div className="text-xl text-white font-medium">
          Outspell your friends, in real time.
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center">
        <div className="flex gap-2">
          <Chip text={`${players.length}/6 Players`} variant="info" />
          {/* TODO: add from game data */}
          {parseFloat(stakeAmount) > 0 && (
            <Chip text={`$${stakeAmount} Buy-in`} variant="info" />
          )}
          {pendingStakes > 0 ? (
            <Chip
              text={`${pendingStakes} Pending`}
              icon={<ClockIcon size={14} />}
              variant="warning"
            />
          ) : players?.length > 0 ? (
            <Chip
              text="Ready"
              icon={<CheckCircleIcon size={14} />}
              variant="success"
            />
          ) : null}
        </div>
        <div className="w-full flex flex-row items-center justify-between">
          <div className="font-medium text-xl text-white">Players in Lobby</div>
          {context?.client.clientFid === FARCASTER_CLIENT_FID && (
            <ShareButton
              customUrl={`${env.NEXT_PUBLIC_URL}/games/${gameId}`}
              customCastText={
                parseFloat(stakeAmount) > 0
                  ? `🎲 Play Squabble with me, buy-in is $${stakeAmount}!`
                  : "🎲 Play Squabble with me!"
              }
            />
          )}
        </div>
        <div className="grid grid-cols-2 grid-rows-3 gap-4">
          <AnimatePresence mode="popLayout">
            {players.map((p, i) => (
              <motion.div
                key={p.fid || p.id}
                className="w-full h-full"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}>
                <LobbyPlayerCard
                  player={p}
                  status={p.ready ? "ready" : "pending"}
                  isCurrentPlayer={
                    p?.fid?.toString() === currentUser?.fid?.toString()
                  }
                />
              </motion.div>
            ))}
            {[...Array(6 - players.length)].map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}>
                <LobbySpotAvailableCard />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {!players.find(
          (p) => p?.fid?.toString() === currentUser?.fid?.toString(),
        ) && !isCurrentUserPending ? (
          <p
            className="text-yellow-200 text-sm cursor-pointer"
            onClick={() => {
              toast.custom(
                (t) => (
                  <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow">
                    <div className="text-green-600 font-medium text-sm">
                      🔄 Refreshing...
                    </div>
                  </div>
                ),
                {
                  position: "top-left",
                  duration: 2000,
                },
              );
              connectToLobby({
                player: {
                  fid: currentUser?.fid!,
                  displayName: currentUser?.displayName,
                  username: currentUser?.username,
                  avatarUrl: formatAvatarUrl(currentUser?.avatarUrl || ""),
                  address: address!,
                },
                gameId,
              });
            }}>
            Don&apos;t see yourself?{" "}
            <span className="underline font-bold">Click to refresh!</span>
          </p>
        ) : (
          <p
            className="text-white text-sm cursor-pointer"
            onClick={() => {
              toast.custom(
                (t) => (
                  <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow">
                    <div className="text-green-600 font-medium text-sm">
                      🔄 Checking for new players...
                    </div>
                  </div>
                ),
                {
                  position: "top-left",
                  duration: 2000,
                },
              );
              connectToLobby({
                player: {
                  fid: currentUser?.fid!,
                  displayName: currentUser?.displayName,
                  username: currentUser?.username,
                  avatarUrl: formatAvatarUrl(currentUser?.avatarUrl || ""),
                  address: address!,
                },
                gameId,
              });
            }}>
            Don&apos;t see your friends?{" "}
            <span className="underline font-bold">Click to refresh!</span>
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 items-center w-full pb-4">
        {isCurrentUserPending && currentUser && parseFloat(stakeAmount) > 0 ? (
          <div className="flex flex-col gap-2 items-center w-full">
            {userAddress ? (
              <>
                <div className="text-white/75 mb-2">
                  {currentUser.fid.toString() === gameLeaderFid.toString()
                    ? "Buy-in to init the game"
                    : "Buy-in to join the game"}
                </div>
                <DaimoPayButton.Custom
                  appId={env.NEXT_PUBLIC_DAIMO_PAY_ID!}
                  toAddress={SQUABBLE_CONTRACT_ADDRESS}
                  toChain={8453} // Base
                  toUnits={stakeAmount}
                  toToken="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base USDC
                  intent="Join Squabble Game"
                  toCallData={joinGameCalldata(contractGameId, userAddress)}
                  preferredChains={[basePreconf.id]} // Prefer Base
                  preferredTokens={[
                    {
                      chain: basePreconf.id,
                      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                    }, // Base USDC
                  ]}
                  externalId={`${gameId}-${currentUser.fid}-${Date.now()}`}
                  metadata={{
                    gameId,
                    playerFid: currentUser.fid.toString(),
                    playerName:
                      currentUser.displayName || currentUser.username || "",
                  }}
                  onPaymentStarted={(e) => console.log("Payment started:", e)}
                  onPaymentCompleted={handlePaymentCompleted}
                  onPaymentBounced={(e) => {
                    console.log("Payment bounced:", e);
                    toast.custom(
                      (t) => (
                        <div className="w-fit flex items-center gap-2 p-2 bg-white  rounded-lg shadow animate-shake">
                          <div className="text-red-600 font-medium text-sm">
                            ❌ Payment was bounced. Please try again.
                          </div>
                        </div>
                      ),
                      {
                        position: "top-left",
                        duration: 5000,
                      },
                    );
                  }}
                  closeOnSuccess={true}
                  resetOnSuccess={true}>
                  {({ show }) => (
                    <SquabbleButton
                      text={`Join for $${stakeAmount}`}
                      variant="primary"
                      disabled={false}
                      onClick={show}
                    />
                  )}
                </DaimoPayButton.Custom>
              </>
            ) : (
              <p className="text-white/75">
                No wallet connected, try refreshing the page.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center w-full">
            <div className="text-white/75">
              {pendingStakes
                ? "Waiting for everyone to pay their stake..."
                : players.length < 2
                  ? "Need at least 2 players to start the game"
                  : "Everyone is ready, start the game!"}
            </div>
            <SquabbleButton
              text="Start Game"
              variant="primary"
              disabled={pendingStakes > 0 || players.length < 2}
              onClick={handleStartGame}
            />
            {currentPlayer?.ready && parseFloat(stakeAmount) > 0 && (
              <SquabbleButton
                text="Withdraw Buy-in"
                variant="outline"
                disabled={areCapabilitiesLoading || areCallsPending}
                onClick={handleGetStakeBack}
                isLoading={isRefunding || areCallsPending}
                loadingText="Refunding..."
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
