"use client";

import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  return (
    <div className="min-h-screen bg-[#A0E9D9] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[64px] mb-1"
            width={64}
            height={64}
          />
          <div
            className={`${luckiestGuy.className} text-4xl text-white tracking-wider`}
          >
            SQUABBLE
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-white text-lg max-w-4xl">
            A fast-paced, social word game designed for private friend groups on
            Farcaster. Compete on the same randomized letter grid in real-time,
            racing against the clock to create many words as possible on the
            grid.
          </p>
        </div>

        {/* <button
          className="bg-white text-[#A0E9D9] px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all"
          onClick={() => {}}
        >
          Start Playing
        </button> */}
      </div>
    </div>
  );
}
