import { Luckiest_Guy } from "next/font/google";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function CoinbaseWalletPlay() {
  return (
    <div className="bg-white/10 backdrop-blur-sm p-4 lg:p-6 rounded-lg border border-white/20 w-full">
      <h3
        className={`${luckiestGuy.className} text-xl lg:text-2xl text-white mb-3`}
      >
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
            Invite <span className="font-bold">@squabble.base.eth</span> to the
            group chat
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#A0E9D9]">3.</span>
          <span>
            Tag <span className="font-bold">@squabble.base.eth</span> in the
            group chat and ask them to start a game
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#A0E9D9]">4.</span>
          <span>
            Bet on the game and compete to see who can find the most words!
          </span>
        </li>
      </ul>
    </div>
  );
}
