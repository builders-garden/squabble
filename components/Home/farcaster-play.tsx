import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SquabbleButton from "@/components/ui/squabble-button";
import { useCreateGame } from "@/hooks/use-create-game";

const BET_AMOUNTS = [
  { label: "Free", value: 0 },
  { label: "$1", value: 1 },
  { label: "$2", value: 2 },
  { label: "$3", value: 3 },
  { label: "$5", value: 5 },
  { label: "Custom", value: null },
];

export default function FarcasterPlay() {
  const router = useRouter();
  const {
    mutate: createGame,
    isPending: isLoading,
    isSuccess,
  } = useCreateGame({
    onSuccess: async (data) => {
      router.push(`/games/${data.id}`);
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustom, setShowCustom] = useState(false);

  const handleCreateGame = () => {
    const buyInAmount = customAmount
      ? parseFloat(customAmount)
      : selectedAmount;
    if (buyInAmount !== null) {
      createGame({ betAmount: buyInAmount });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div>
          <SquabbleButton
            text="Create Game"
            variant="primary"
            disabled={false}
            onClick={() => {}}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="bg-[#1B7A6E] border-2 border-[#C8EFE3] rounded-xl text-white max-w-md w-[90%] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Select Buy-in Amount
          </DialogTitle>
          <DialogDescription className="text-white/75">
            Choose buy-in amount for this game
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {BET_AMOUNTS.map((amount) => (
              <button
                key={amount.label}
                onClick={() => {
                  if (amount.value === null) {
                    setShowCustom(!showCustom);
                    if (!showCustom) {
                      setSelectedAmount(null);
                    }
                  } else {
                    setSelectedAmount(amount.value);
                    setCustomAmount("");
                    setShowCustom(false);
                  }
                }}
                className={`h-[60px] rounded-xl border-2 transition-all ${
                  amount.value === selectedAmount ||
                  (amount.value === null && showCustom)
                    ? "border-white bg-white/30"
                    : "border-[#204c3f] bg-white/10 hover:bg-white/15"
                }`}>
                <div className="text-xl font-bold">{amount.label}</div>
              </button>
            ))}
          </div>

          {showCustom && (
            <div className="px-4 py-3 rounded-xl border-2 border-[#C8EFE3] bg-white/10">
              <input
                type="number"
                min="0"
                step="0.01"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                placeholder="Enter amount in USDC"
                className="w-full bg-transparent text-white placeholder-white/50 outline-none text-lg"
              />
            </div>
          )}
        </div>
        <SquabbleButton
          text={"Confirm"}
          variant="primary"
          isLoading={isLoading || isSuccess}
          loadingText={isSuccess ? "Joining..." : "Creating..."}
          disabled={(selectedAmount === null && !customAmount) || isLoading}
          onClick={handleCreateGame}
        />
      </DialogContent>
    </Dialog>
  );
}
