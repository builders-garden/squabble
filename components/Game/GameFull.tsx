import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function GameFull() {
  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
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
            Game is Full!
          </h2>
          <p className="text-white font-medium">
            This game has reached its maximum capacity of 6 players. Please try
            joining another game.
          </p>
        </div>

        <div className="animate-pulse rounded-full h-8 w-8 border-2 border-white"></div>
      </div>
    </div>
  );
}
