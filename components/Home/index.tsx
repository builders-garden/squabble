"use client";

import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { Volume2, VolumeX } from "lucide-react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { useEffect } from "react";
import { basePreconf } from "viem/chains";
import { useAccount, useConnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { FarcasterLink } from "@/components/shared/farcaster-link";
import { useAudio } from "@/contexts/audio-context";
import { useWalletDetector } from "@/contexts/wallet-detector-context";
import { useMiniApp } from "@/hooks/use-miniapp";
import { useSignIn } from "@/hooks/use-sign-in";
import { FARCASTER_CLIENT_FID } from "@/lib/constants";
import CoinbaseWalletPlay from "./coinbase-wallet-play";
import FarcasterPlay from "./farcaster-play";
import Website from "./website";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  const { signIn } = useSignIn({
    autoSignIn: true,
  });
  const { context, isMiniAppReady } = useMiniApp();
  const { isMusicPlaying, toggleMusic } = useAudio();
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { isCoinbaseWallet } = useWalletDetector();

  useEffect(() => {
    if (!isConnected) {
      console.log("connecting wallet");
      if (isCoinbaseWallet) {
        connect({
          chainId: basePreconf.id,
          connector: coinbaseWallet({
            appName: "Squabble",
          }),
        });
      } else if (context) {
        connect({ chainId: basePreconf.id, connector: miniAppConnector() });
      }
    }
  }, [isConnected, context, isCoinbaseWallet, connect]);

  if (!context || !isMiniAppReady) {
    return <Website />;
  }

  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
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

      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 mb-8">
        {/* Left Column - Text Content */}
        <div className="flex-1 flex flex-col items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-row items-center justify-center w-full">
            <Image
              src="/images/logo.png"
              alt="Squabble Logo"
              className="w-[64px] lg:w-[96px] mb-1"
              width={96}
              height={96}
            />
            <div
              className={`${luckiestGuy.className} text-center text-4xl lg:text-6xl text-white tracking-wider`}>
              SQUABBLE
            </div>
          </div>

          <p className="text-white text-xl lg:text-lg text-center">
            Real-time Scrabble-like word game with buy-ins.
          </p>

          {context.client.clientFid === FARCASTER_CLIENT_FID ? (
            <FarcasterPlay />
          ) : (
            <CoinbaseWalletPlay />
          )}

          {/* Right Column - App Screenshot */}
          <div className="flex-1 flex justify-center w-full lg:w-auto">
            <Image
              src="/images/app-screenshot.png"
              alt="Squabble App Screenshot"
              width={500}
              height={800}
              className="rounded-lg w-full max-w-[300px] lg:max-w-[500px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-white/80 text-xs lg:text-sm text-center w-full px-4 mt-8">
          Built with ❤️ by{" "}
          <FarcasterLink
            link="https://builders.garden"
            target="_blank"
            text="builders.garden"
            color="white"
          />
        </div>
      </div>
    </div>
  );
}
