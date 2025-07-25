import { createAppClient, viemConnector } from "@farcaster/auth-client";

import { env } from "@/lib/env";
import { fetchUser } from "@/lib/neynar";
import { createOrUpdateUser } from "@/lib/prisma/user";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  let { fid } = await req.json();

  if (!fid)
    return NextResponse.json(
      { success: false, error: "Missing FID" },
      { status: 401 }
    );

  const neynarUser = await fetchUser(fid.toString());

  const user = await createOrUpdateUser(
    fid,
    neynarUser.display_name,
    neynarUser.username,
    neynarUser.pfp_url
  );

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  // Create the response
  const response = NextResponse.json({ success: true, user });

  // Set the auth cookie with the JWT token
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return response;
};
