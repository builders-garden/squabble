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
            className="w-[48px] mb-1"
            width={48}
            height={48}
          />
          <div
            className={`${luckiestGuy.className} text-2xl text-white tracking-wider`}
          >
            SQUABBLE
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className={`${luckiestGuy.className} text-4xl text-white`}>
            Welcome to Squabble
          </h1>
          <p className="text-white text-lg max-w-md">
            The ultimate word game where strategy meets vocabulary. Challenge
            your friends and show off your word skills!
          </p>
        </div>

        <button
          className="bg-white text-[#A0E9D9] px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all"
          onClick={() => {
            /* Add your game start logic here */
          }}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
