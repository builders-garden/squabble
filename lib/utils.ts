import { GameStatus } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAvatarUrl = (avatarUrl: string) => {
  if (
    avatarUrl.endsWith("/rectcrop3") ||
    avatarUrl.endsWith("/original") ||
    avatarUrl.endsWith("/public")
  ) {
    avatarUrl = avatarUrl.replace(
      "/rectcrop3",
      "/anim=false,fit=contain,f=auto,w=512"
    );
    avatarUrl = avatarUrl.replace(
      "/public",
      "/anim=false,fit=contain,f=auto,w=512"
    );
    avatarUrl = avatarUrl.replace(
      "/original",
      "/anim=false,fit=contain,f=auto,w=512"
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
