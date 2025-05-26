-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "betAmount" REAL NOT NULL,
    "creator" TEXT NOT NULL,
    "totalFunds" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "joined" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "gameId" TEXT NOT NULL,
    "paymentHash" TEXT,
    CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
