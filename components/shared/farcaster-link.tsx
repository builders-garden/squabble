"use client";

import sdk from "@farcaster/miniapp-sdk";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { useMiniApp } from "@/hooks/use-miniapp";
import { cn } from "@/lib/utils";

export const FarcasterLink = ({
  link,
  text,
  target = "_blank",
  fontSize = "14px",
  color = "white",
  mt = "0",
}: {
  link: string;
  text: string;
  target?: string;
  textAlign?: string;
  fontSize?: string;
  color?: string;
  cursor?: string;
  mt?: string;
}) => {
  const { context } = useMiniApp();

  const openFarcasterUrl = useCallback(() => {
    sdk.actions.openUrl(link);
  }, [link]);

  return (
    <div className="w-full flex items-center justify-center">
      {context ? (
        <p
          className={`text-md ${fontSize} text-${color} text-center underline cursor-pointer flex items-center justify-center gap-1`}
          onClick={openFarcasterUrl}>
          {text}
          <ExternalLinkIcon size={16} />
        </p>
      ) : (
        <Link
          href={link}
          target={target}
          className={cn(
            `w-full text-md ${fontSize} text-${color} text-center underline cursor-pointer flex items-center justify-center gap-1`,
            `mt-${mt}`,
          )}>
          {text}
          <ExternalLinkIcon size={16} />
        </Link>
      )}
    </div>
  );
};
