import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const contractId = searchParams.get("contractId");

  // Validate that exactly one parameter is provided
  if ((!id && !contractId) || (id && contractId)) {
    return NextResponse.json(
      { error: "Provide exactly one parameter: either 'id' or 'contractId'" },
      { status: 400 },
    );
  }

  try {
    if (id) {
      // Convert database ID (UUID) to contract ID
      const game = await prisma.game.findUnique({
        where: { id },
        select: { id: true, contractGameId: true },
      });

      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: game.id,
        contractId: game.contractGameId,
        conversion: "id-to-contractId",
      });
    }

    if (contractId) {
      // Convert contract ID to database ID (UUID)
      const contractIdNumber = parseInt(contractId);

      if (isNaN(contractIdNumber)) {
        return NextResponse.json(
          { error: "Invalid contractId: must be a number" },
          { status: 400 },
        );
      }

      const game = await prisma.game.findUnique({
        where: { contractGameId: contractIdNumber },
        select: { id: true, contractGameId: true },
      });

      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: game.id,
        contractId: game.contractGameId,
        conversion: "contractId-to-id",
      });
    }
  } catch (error) {
    console.error("Game ID conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
