import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sendFarcasterNotification } from "@/lib/notification-client";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("x-notification-secret");
  if (auth !== env.NOTIFICATION_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { fid, notification } = body;

    const result = await sendFarcasterNotification({
      fid,
      title: notification.title,
      body: notification.body,
      notificationDetails: notification.notificationDetails,
    });

    if (result.state === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
