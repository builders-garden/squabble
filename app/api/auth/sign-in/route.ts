import { createClient, Errors } from "@farcaster/quick-auth";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getOrCreateUserFromFid } from "@/lib/prisma/user";
import { userIsNotAdminAndIsNotProduction } from "@/lib/utils";

export const dynamic = "force-dynamic";

const quickAuthClient = createClient();

export const POST = async (req: NextRequest) => {
  const {
    token: farcasterToken,
    fid: contextFid,
  } = await req.json();

  if (!farcasterToken || !contextFid) {
    console.error("Invalid arguments", {
      farcasterToken,
      contextFid,
    });
    return NextResponse.json(
      { success: false, error: "Invalid arguments" },
      { status: 400 },
    );
  }

  let fid;
  let isValidSignature;
  const monthInMs = 30 * 24 * 60 * 60 * 1000;
  let expirationTime = new Date(Date.now() + monthInMs); // 30 days in milliseconds

  // Verify signature matches custody address and auth address
  try {
    const payload = await quickAuthClient.verifyJwt({
      domain: new URL(env.NEXT_PUBLIC_URL).hostname,
      token: farcasterToken,
    });
    isValidSignature = !!payload;
    fid = payload.sub;
    expirationTime = payload.exp
      ? new Date(Number(payload.exp) * 1000 + monthInMs)
      : new Date(Date.now() + monthInMs);
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error("Invalid token", e);
      isValidSignature = false;
    }
    console.error("Error verifying token", e);
  }

  if (!isValidSignature || !fid || isNaN(Number(fid)) || fid !== contextFid) {
    console.error("Invalid token for fid", fid, "contextFid", contextFid);
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 },
    );
  }

  if (userIsNotAdminAndIsNotProduction(Number(fid))) {
    console.error("User is not admin and this is not production", {
      fid,
    });
    return NextResponse.json({ message: "Unauthorized env" }, { status: 403 });
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    timestamp: Date.now(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);

  const user = await getOrCreateUserFromFid(
    Number(fid),
  );

  // Create the response
  const response = NextResponse.json({ success: true, user });

  // Set the auth cookie with the JWT token
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: monthInMs / 1000, // 30 days in seconds
    path: "/",
  });

  return response;
};
