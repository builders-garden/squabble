import { PostHog } from "posthog-node";
import { env } from "@/lib/env";

const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
  host: "https://eu.i.posthog.com",
});

export const trackEvent = (
  event: string,
  properties: Record<string, unknown>,
  distinctId?: string,
) => {
  if (!!env.NEXT_PUBLIC_POSTHOG_DISABLED) {
    return;
  }
  console.log("[POSTHOG] Tracking event", event, properties);
  posthog.capture({
    distinctId: distinctId || "anonymous",
    event,
    properties,
  });
};
