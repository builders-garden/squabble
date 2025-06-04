"use client";

import { AudioProvider } from "@/contexts/audio-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { SocketProvider } from "@/contexts/socket-context";
import { DaimoPayProvider } from "@daimo/pay";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <SocketProvider>
        <MiniAppProvider>
          <DaimoPayProvider>
            <AudioProvider>{children}</AudioProvider>
          </DaimoPayProvider>
        </MiniAppProvider>
      </SocketProvider>
    </ErudaProvider>
  );
}
