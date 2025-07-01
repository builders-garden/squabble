"use client";

import { AudioProvider } from "@/contexts/audio-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { UserProvider } from "@/contexts/user-context";
import { DaimoPayProvider } from "@daimo/pay";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <MiniAppProvider>
        <UserProvider>
          <DaimoPayProvider>
            <AudioProvider>{children}</AudioProvider>
          </DaimoPayProvider>
        </UserProvider>
      </MiniAppProvider>
    </ErudaProvider>
  );
}
