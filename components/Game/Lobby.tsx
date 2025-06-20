"use client";
import useSocketUtils from "@/hooks/use-socket-utils";
import {
  SQUABBLE_CONTRACT_ABI,
  SQUABBLE_CONTRACT_ADDRESS,
} from "@/lib/constants";
import { joinGameCalldata } from "@/lib/daimo";
import { env } from "@/lib/env";
import { Player } from "@/types/socket-events";
import { DaimoPayButton } from "@daimo/pay";
import { PaymentCompletedEvent } from "@daimo/pay-common";
import { User } from "@prisma/client";
import { CheckCircle, ClockCircle } from "@solar-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { base } from "viem/chains";
import { useAccount, useWriteContract } from "wagmi";
import Chip from "../ui/chip";
import LobbyPlayerCard from "../ui/lobby-player-card";
import LobbySpotAvailableCard from "../ui/lobby-spot-available-card";
import SquabbleButton from "../ui/squabble-button";

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
  const { playerStakeConfirmed, startGame, playerStakeRefunded } =
    useSocketUtils();
  const { data: txHash, writeContract } = useWriteContract();
  const [isRefunding, setIsRefunding] = useState(false);
  const { address } = useAccount();

  // Find current user in players list to check their status
  const currentPlayer = currentUser
    ? players.find((p) => {
        // Handle both string and number fids
        const currentUserFid =
          typeof currentUser.fid === "string"
            ? parseInt(currentUser.fid)
            : currentUser.fid;
        // Player objects may use 'id' or 'fid'
        return p.id === currentUserFid || p.fid === currentUserFid;
      })
    : null;
  const isCurrentUserPending = currentPlayer && !currentPlayer.ready;

  const handlePaymentCompleted = (event: PaymentCompletedEvent) => {
    console.log("Payment completed:", event);
    if (currentUser && event.txHash) {
      // Emit socket event to confirm stake payment
      playerStakeConfirmed(
        {
          fid: currentUser.fid,
          displayName: currentUser.displayName,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          address: address!,
        },
        gameId,
        event.txHash as string,
        event.payment.source?.payerAddress as string
      );
    }
  };

  const handleStartGame = () => {
    setGameState("loading");
    startGame(currentPlayer!, gameId);
  };

  const handleGetStakeBack = async () => {
    // onchain call to get stake back using wagmi
    try {
      console.log("Getting stake back");
      console.log(userAddress);
      setIsRefunding(true);
      await writeContract({
        address: SQUABBLE_CONTRACT_ADDRESS as `0x${string}`,
        abi: SQUABBLE_CONTRACT_ABI,
        functionName: "withdrawFromGame",
        args: [BigInt(contractGameId)],
      });
    } catch (error) {
      console.error(error);
      toast.custom(
        (t) => (
          <div className="w-fit flex items-center gap-2 p-2 bg-white  rounded-lg shadow animate-shake">
            <div className="text-red-600 font-medium text-sm">
              ❌ Failed to get stake back. Please try again.
            </div>
          </div>
        ),
        {
          position: "top-left",
          duration: 5000,
        }
      );
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    if (txHash) {
      playerStakeRefunded(currentPlayer!, gameId, txHash as `0x${string}`);
      toast.custom(
        (t) => (
          <div className="w-fit flex items-center gap-2 p-2 bg-white  rounded-lg shadow animate-shake">
            <div className="text-green-600 font-medium text-sm">
              ✅ Stake refunded.
            </div>
          </div>
        ),
        {
          position: "top-left",
          duration: 5000,
        }
      );
      setIsRefunding(false);
    }
  }, [txHash]);

  const pendingStakes = players.filter((p) => !p.ready).length;
  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-between p-4">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Squabble Logo"
          className="w-[120px]"
          width={120}
          height={120}
        />
        <div
          className={`${luckiestGuy.className} text-4xl text-white tracking-wider`}
        >
          SQUABBLE
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
            <Chip text={`$${stakeAmount} Stake`} variant="info" />
          )}
          {pendingStakes > 0 ? (
            <Chip
              text={`${pendingStakes} Pending stakes`}
              icon={<ClockCircle size={14} />}
              variant="warning"
            />
          ) : players?.length > 0 ? (
            <Chip
              text="Ready"
              icon={<CheckCircle size={14} />}
              variant="success"
            />
          ) : null}
        </div>
        <div className="font-medium text-xl text-white">Players in Lobby</div>
        <div className="grid grid-cols-2 grid-rows-3 gap-4">
          <AnimatePresence mode="popLayout">
            {players.map((p, i) => (
              <motion.div
                key={p.fid || p.id}
                className="w-full h-full"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <LobbyPlayerCard
                  player={p}
                  status={p.ready ? "ready" : "pending"}
                  isCurrentPlayer={
                    p.fid?.toString() === currentUser?.fid?.toString()
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
                transition={{ duration: 0.2 }}
              >
                <LobbySpotAvailableCard />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center w-full pb-4">
        {isCurrentUserPending && currentUser && parseFloat(stakeAmount) > 0 ? (
          <div className="flex flex-col gap-2 items-center w-full">
            <div className="text-white/75 mb-2">
              {currentUser.fid.toString() === gameLeaderFid.toString()
                ? "Pay your stake to init the game"
                : "Pay your stake to join the game"}
            </div>
            <DaimoPayButton.Custom
              appId={env.NEXT_PUBLIC_DAIMO_PAY_ID!}
              toAddress={SQUABBLE_CONTRACT_ADDRESS}
              toChain={8453} // Base
              toUnits={stakeAmount}
              toToken="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base USDC
              intent="Join Squabble Game"
              toCallData={joinGameCalldata(contractGameId, userAddress)}
              preferredChains={[base.id]} // Prefer Base
              preferredTokens={[
                {
                  chain: base.id,
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
                  }
                );
              }}
              closeOnSuccess={true}
              resetOnSuccess={true}
            >
              {({ show }) => (
                <SquabbleButton
                  text={`Stake $${stakeAmount}`}
                  variant="primary"
                  disabled={false}
                  onClick={show}
                />
              )}
            </DaimoPayButton.Custom>
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
                text="Get Stake Back"
                variant="outline"
                disabled={false}
                onClick={handleGetStakeBack}
                isLoading={isRefunding}
                loadingText="Refunding..."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
