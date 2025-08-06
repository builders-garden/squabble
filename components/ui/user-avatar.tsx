import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function UserAvatar({
  avatarUrl,
  username,
  size,
  className,
}: {
  avatarUrl?: string;
  username?: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        size === "xs" ? "h-6 w-6" : "h-8 w-8",
        size === "md"
          ? "h-10 w-10"
          : size === "lg"
            ? "h-12 w-12"
            : size === "xl"
              ? "h-14 w-14"
              : "",
        className,
      )}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Viewer"
          fill
          sizes="100px"
          className="object-cover w-full h-full"
        />
      ) : username ? (
        <Avatar key={username} className="size-4">
          <AvatarFallback>
            {username
              .split("")
              .map((x) => x[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
