import { env } from "@/lib/env";
import { fetchUser } from "@/lib/neynar";
import { createOrUpdateUser } from "@/lib/prisma/user";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";

export const POST = async (req: NextRequest) => {
  let { fid, signature, message } = await req.json();
  const neynarUser = await fetchUser(fid);

  // Verify signature matches custody address
  const isValidSignature = await verifyMessage({
    address: neynarUser.custody_address as `0x${string}`,
    message,
    signature,
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const user = await createOrUpdateUser(fid, neynarUser.display_name, neynarUser.username, neynarUser.pfp_url);

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    walletAddress: neynarUser.custody_address as `0x${string}`,
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
};
