import { env } from "@/lib/env";
import posthog from "posthog-js";

export const trackEvent = (event: string, data: Record<string, unknown>) => {
  if (env.NEXT_PUBLIC_POSTHOG_DISABLED === "true") {
    return;
  }
  console.log("[POSTHOG] Tracking event", event, data);
  return posthog.capture(event, data);
};
