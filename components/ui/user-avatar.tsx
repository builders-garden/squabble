import Image from "next/image";
import { cn } from "@/lib/utils";

export default function UserAvatar({
  avatarUrl,
  size,
  className,
}: {
  avatarUrl: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        size === "xs"
          ? "h-6 w-6"
          : "h-8 w-8",
        size === "md"
          ? "h-10 w-10"
          : size === "lg"
            ? "h-12 w-12"
            : size === "xl"
              ? "h-14 w-14"
              : "",
        className,
      )}>
      <Image
        src={avatarUrl}
        alt="Viewer"
        fill
        sizes="100px"
        className="object-cover w-full h-full"
      />
    </div>
  );
}
