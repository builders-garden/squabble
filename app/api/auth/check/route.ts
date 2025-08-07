import { NextRequest, NextResponse } from "next/server";
import { getUserByFid } from "@/lib/prisma/user";
import { userIsNotAdminAndIsNotProduction } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const fid = request.headers.get("x-user-fid");
  if (!fid || isNaN(Number(fid))) {
    console.error("Invalid fid", fid);
    return NextResponse.json(
      { status: "nok", error: "Unauthorized user" },
      { status: 200 },
    );
  }
  if (userIsNotAdminAndIsNotProduction(Number(fid))) {
    console.error("User is not admin and this is not production for fid", fid);
    return NextResponse.json(
      { status: "nok", error: "Unauthorized env" },
      { status: 200 },
    );
  }

  const user = await getUserByFid(Number(fid));
  if (!user) {
    console.error("User not found for fid", fid);
    return NextResponse.json(
      { status: "nok", error: "User not found" },
      { status: 200 },
    );
  }

  return NextResponse.json({ status: "ok", user }, { status: 200 });
}
