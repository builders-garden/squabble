import { GameStatus } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "@/lib/env";
import { ADMIN_FIDS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAvatarUrl = (avatarUrl: string) => {
  if (!avatarUrl) return "";
  if (
    avatarUrl.endsWith("/rectcrop3") ||
    avatarUrl.endsWith("/original") ||
    avatarUrl.endsWith("/public")
  ) {
    avatarUrl = avatarUrl.replace(
      "/rectcrop3",
      "/anim=false,fit=contain,f=auto,w=512",
    );
    avatarUrl = avatarUrl.replace(
      "/public",
      "/anim=false,fit=contain,f=auto,w=512",
    );
    avatarUrl = avatarUrl.replace(
      "/original",
      "/anim=false,fit=contain,f=auto,w=512",
    );
  }
  return avatarUrl;
};

export const gameStatusToState = (status: GameStatus) => {
  switch (status) {
    case GameStatus.PENDING:
      return "lobby";
    case GameStatus.PLAYING:
      return "live";
    case GameStatus.FINISHED:
      return "ended";
    default:
      return "lobby";
  }
};

export function uuidToBigInt(uuid: string): bigint {
  // Remove hyphens to get full hex string
  const hex = uuid.replace(/-/g, "");

  // Take only the first 6 hex characters (24 bits) to ensure safe range
  // This gives us ~16 million possible values, which is still very unique
  // and fits comfortably within 32-bit signed integer range (max: 2,147,483,647)
  const safeHex = hex.substring(0, 6);

  return BigInt("0x" + safeHex);
}

export const userIsNotAdminAndIsNotProduction = (fid: number): boolean => {
  return (
    env.NEXT_PUBLIC_URL !== "https://squabble.lol" &&
    !ADMIN_FIDS.includes(Number(fid))
  );
};
