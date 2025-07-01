import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import SquabbleButton from "../ui/squabble-button";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function NoWallet() {
  const { connect } = useConnect();
  const { address } = useAccount();
  const handleConnectWallet = () => {
    console.log("connecting wallet");
    connect({ connector: miniAppConnector() });
    console.log("wallet connected", address);
  };
  useEffect(() => {
    handleConnectWallet();
  }, []);

  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
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
          Please connect your wallet to play!
        </div>
        <SquabbleButton
          onClick={handleConnectWallet}
          variant="primary"
          text="Connect Wallet"
          disabled={false}
        />
      </div>
    </div>
  );
}
