"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { FARCASTER_CLIENT_FID } from "@/lib/constants";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import CoinbaseWalletPlay from "./coinbase-wallet-play";
import FarcasterPlay from "./farcaster-play";
import Website from "./website";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();

  if (!context || !isMiniAppReady) {
    return <Website />;
  }

  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
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
              className={`${luckiestGuy.className} text-center text-4xl lg:text-6xl text-white tracking-wider`}
            >
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
          <a
            href="https://builders.garden"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            builders.garden
          </a>
        </div>
      </div>
    </div>
  );
}
