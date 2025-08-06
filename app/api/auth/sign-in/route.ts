import { createClient, Errors } from "@farcaster/quick-auth";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getOrCreateUserFromFid } from "@/lib/prisma/user";

export const dynamic = "force-dynamic";

const quickAuthClient = createClient();

export const POST = async (req: NextRequest) => {
  const {
    referrerFid,
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
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  let expirationTime = new Date(Date.now() + weekInMs); // 7 days in milliseconds

  // Verify signature matches custody address and auth address
  try {
    const payload = await quickAuthClient.verifyJwt({
      domain: new URL(env.NEXT_PUBLIC_URL).hostname,
      token: farcasterToken,
    });
    isValidSignature = !!payload;
    fid = payload.sub;
    expirationTime = payload.exp
      ? new Date(Number(payload.exp) * 1000 + weekInMs)
      : new Date(Date.now() + weekInMs);
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error("Invalid token", e);
      isValidSignature = false;
    }
    console.error("Error verifying token", e);
  }

  if (!isValidSignature || !fid || isNaN(Number(fid)) || fid !== contextFid)
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 },
    );

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
    referrerFid ? Number(referrerFid) : undefined,
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
};
