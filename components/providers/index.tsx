"use client";

import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { CustomWagmiProvider } from "@/components/providers/custom-wagmi-provider";
import { AudioProvider } from "@/contexts/audio-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { SocketProvider } from "@/contexts/socket-context";
import { UserProvider } from "@/contexts/user-context";
import { env } from "@/lib/env";

const ErudaProvider = dynamic(
  () => import("@/components/providers/eruda").then((c) => c.ErudaProvider),
  { ssr: false },
);

if (typeof window !== "undefined" && !env.NEXT_PUBLIC_POSTHOG_DISABLED) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <ErudaProvider>
        <CustomWagmiProvider>
          <MiniAppProvider addMiniAppOnLoad={true}>
            <UserProvider>
              <SocketProvider>
                <AudioProvider>{children}</AudioProvider>
              </SocketProvider>
            </UserProvider>
          </MiniAppProvider>
        </CustomWagmiProvider>
      </ErudaProvider>
    </PostHogProvider>
  );
}
