import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";

import { ConnectWallet } from "@coinbase/onchainkit/wallet";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function NoWallet() {
  return (
    <div className="min-h-screen bg-[#A0E9D9] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
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
        <div className="text-white font-medium text-center">
          Please connect your wallet to continue
        </div>
        <ConnectWallet />
      </div>
    </div>
  );
}
