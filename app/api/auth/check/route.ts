import { NextRequest, NextResponse } from "next/server";
import { getUserByFid } from "@/lib/prisma/user";

export async function GET(request: NextRequest) {
  const fid = request.headers.get("x-user-fid");
  if (!fid || isNaN(Number(fid)))
    return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });

  const user = await getUserByFid(Number(fid));
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user, { status: 200 });
}
