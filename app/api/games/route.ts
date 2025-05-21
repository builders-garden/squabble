import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "GET /api/games is working" });
}
