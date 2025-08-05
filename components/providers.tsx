"use client";

import { DaimoPayProvider } from "@daimo/pay";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { AudioProvider } from "@/contexts/audio-context";
import { MiniAppProvider } from "@/contexts/miniapp-context";
import { UserProvider } from "@/contexts/user-context";
import { env } from "@/lib/env";

const ErudaProvider = dynamic(
  () => import("./Eruda").then((c) => c.ErudaProvider),
  { ssr: false },
);

if (
  typeof window !== "undefined" &&
  env.NEXT_PUBLIC_POSTHOG_DISABLED !== "true"
) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    // api_host: env.NEXT_PUBLIC_POSTHOG_HOST!,
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <ErudaProvider>
        <MiniAppProvider addMiniAppOnLoad={true}>
          <UserProvider>
            <DaimoPayProvider>
              <AudioProvider>{children}</AudioProvider>
            </DaimoPayProvider>
          </UserProvider>
        </MiniAppProvider>
      </ErudaProvider>
    </PostHogProvider>
  );
}
