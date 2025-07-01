"use client";

import { AudioProvider } from "@/contexts/audio-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { SocketProvider } from "@/contexts/socket-context";
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
          <SocketProvider>
            <DaimoPayProvider>
              <AudioProvider>{children}</AudioProvider>
            </DaimoPayProvider>
          </SocketProvider>
        </UserProvider>
      </MiniAppProvider>
    </ErudaProvider>
  );
}
