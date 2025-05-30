import { getUserByFid } from "@/lib/prisma/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fid = request.headers.get("x-user-fid")!;
  const user = await getUserByFid(parseInt(fid));
  return NextResponse.json(user);
}
