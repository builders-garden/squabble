import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import sdk from "@farcaster/miniapp-sdk";
import { Copy, Share } from "@solar-icons/react";
import Image from "next/image";
import { toast } from "sonner";

interface ShareButtonProps {
  text?: string;
  icon?: React.ReactNode;
  customUrl: string;
  customCastText?: string;
}

export default function ShareButton({
  text = "Share",
  icon = <Share size={16} color="white" />,
  customUrl,
  customCastText,
}: ShareButtonProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(customUrl);
      toast.custom(
        (t) => (
          <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow animate-shake">
            <div className="text-green-600 font-medium text-sm">
              ✅ Link copied to clipboard
            </div>
          </div>
        ),
        {
          position: "top-left",
          duration: 5000,
        }
      );
    } catch (error) {
      console.error("Error copying link:", error);
      toast.custom(
        (t) => (
          <div className="w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow animate-shake">
            <div className="text-red-600 font-medium text-sm">
              ❌ Failed to copy link. Please try again.
            </div>
          </div>
        ),
        {
          position: "top-left",
          duration: 5000,
        }
      );
    }
  };

  const handleShareViaCast = async () => {
    await sdk.actions.composeCast({
      text: customCastText || "Check this out!",
      embeds: [customUrl],
      channelKey: "squabble",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex gap-1 items-center cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none">
          <p className="text-white text-sm">{text}</p>
          {icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShareViaCast}>
          <div className="flex items-center gap-2">
            <Image
              src="/images/farcaster-logo.svg"
              alt="Farcaster Logo"
              width={16}
              height={16}
            />
            <p className="text-black text-sm">Share via cast</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <div className="flex items-center gap-2">
            <Copy size={16} color="black" />
            <p className="text-black text-sm">Copy link</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
