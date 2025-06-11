import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function GameStarted() {
  return (
    <div className="min-h-screen bg-[#A0E9D9] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[36px] mb-1"
            width={36}
            height={36}
          />
          <div
            className={`${luckiestGuy.className} text-xl text-white tracking-wider`}
          >
            SQUABBLE
          </div>
        </div>

        <div className="text-center">
          <h2 className={`${luckiestGuy.className} text-2xl text-white mb-2`}>
            Game Already Started!
          </h2>
          <p className="text-white font-medium">
            This game is currently in progress. Please wait until it ends to
            join a new game.
          </p>
        </div>

        <div className="animate-pulse rounded-full h-8 w-8 border-2 border-white"></div>
      </div>
    </div>
  );
}
