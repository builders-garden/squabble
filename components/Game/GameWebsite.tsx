import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { BaseIcon, FarcasterIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

const luckiestGuy = Luckiest_Guy({
  weight: "400",
  subsets: ["latin"],
});

interface GameWebsiteProps {
  gameId: string;
}

export default function GameWebsite({ gameId }: GameWebsiteProps) {
  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 mb-8">
        {/* Left Column - Text Content */}
        <div className="flex-1 flex flex-col items-start gap-4 w-full lg:w-auto">
          <div className="flex flex-row items-center">
            <Image
              src="/images/logo.png"
              alt="Squabble Logo"
              className="w-[64px] lg:w-[96px] mb-1"
              width={96}
              height={96}
            />
            <div
              className={`${luckiestGuy.className} text-4xl lg:text-6xl text-white tracking-wider`}>
              SQUABBLE
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-white text-base lg:text-lg">
              A fast-paced, social word game designed for private friend groups
              on Farcaster. Compete on the same randomized letter grid in
              real-time, racing against the clock to create many words as
              possible on the grid.
            </p>
          </div>

          <div className="py-4 lg:py-6 rounded-lg w-full justify-start">
            <h3
              className={`${luckiestGuy.className} text-xl lg:text-2xl text-white mb-3`}>
              Join Game
            </h3>
            <p className="text-white text-sm lg:text-base pb-4">
              You have been invited to a game of Squabble.
              <br />
              Open in Farcaster or Base to join the game.
            </p>
            <div className="flex flex-row gap-2 ">
              <PlayButton
                href={`${env.NEXT_PUBLIC_MINI_APP_URL}/games/${gameId}`}>
                <FarcasterIcon className="w-4 h-4" />
                Farcaster
              </PlayButton>

              <PlayButton href={`https://squabble.lol/games/${gameId}`}>
                <BaseIcon className="w-4 h-4" />
                Base
              </PlayButton>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 lg:p-6 rounded-lg border border-white/20 w-full">
            <h3
              className={`${luckiestGuy.className} text-xl lg:text-2xl text-white mb-3`}>
              How to Play
            </h3>
            <ul className="text-white space-y-2 text-sm lg:text-base">
              <li className="flex items-start gap-2">
                <span className="text-[#A0E9D9]">1.</span>
                <span>Create a group chat on Coinbase Wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A0E9D9]">2.</span>
                <span>
                  Invite <span className="font-bold">@squabble.base.eth</span>{" "}
                  to the group chat
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A0E9D9]">3.</span>
                <span>
                  Tag <span className="font-bold">@squabble.base.eth</span> in
                  the group chat and ask them to start a game
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A0E9D9]">4.</span>
                <span>
                  Bet on the game and compete to see who can find the most
                  words!
                </span>
              </li>
            </ul>
          </div>
        </div>

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
          className="underline hover:text-white transition-colors">
          builders.garden
        </a>
      </div>
    </div>
  );
}

const PlayButton = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <Button
      variant="outline"
      className="px-4 py-2 rounded-md min-w-[120px] flex flex-row items-center gap-2"
      asChild>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </Link>
    </Button>
  );
};
