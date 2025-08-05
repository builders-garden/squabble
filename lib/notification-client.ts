import {
  MiniAppNotificationDetails,
  sendNotificationResponseSchema,
  type SendNotificationRequest,
} from "@farcaster/miniapp-sdk";
import ky from "ky";
import { env } from "@/lib/env";

export type SendFarcasterNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "invalid_token"; invalidTokens: string[] }
  | { state: "rate_limit"; rateLimitedTokens: string[] }
  | { state: "success" };

/**
 * Send a notification to a Farcaster user.
 *
 * @param fid - The Farcaster user ID
 * @param title - The title of the notification
 * @param body - The body of the notification
 * @param targetUrl - The URL to redirect to when the notification is clicked (optional)
 * @param notificationDetails - The notification details of the user (required)
 * @returns The result of the notification
 */
export async function sendFarcasterNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationDetails,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl?: string;
  notificationDetails?: MiniAppNotificationDetails | null;
}): Promise<SendFarcasterNotificationResult> {
  if (!notificationDetails) {
    return { state: "no_token" };
  }

  const response = await ky.post(notificationDetails.url, {
    json: {
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl: targetUrl ?? env.NEXT_PUBLIC_URL,
      tokens: [notificationDetails.token],
    } satisfies SendNotificationRequest,
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      return {
        state: "rate_limit",
        rateLimitedTokens: responseBody.data.result.rateLimitedTokens,
      };
    }

    return { state: "success" };
  }

  return { state: "error", error: responseJson };
}
