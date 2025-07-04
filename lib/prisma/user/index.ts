import { User } from "@prisma/client";
import { prisma } from "../client";

// Create or update a user
export const createOrUpdateUser = async (
  fid: number,
  displayName: string,
  username: string,
  avatarUrl: string
) => {
  return await prisma.user.upsert({
    where: { fid },
    update: {
      displayName,
      username,
      avatarUrl,
    },
    create: {
      fid,
      displayName,
      username,
      avatarUrl,
    },
  });
};

// Get a user by their FID
export const getUserByFid = async (fid: number) => {
  return await prisma.user.findUnique({
    where: { fid },
    include: {
      participatedGames: true,
    },
  });
};

// Get a user by their username
export const getUserByUsername = async (username: string) => {
  return await prisma.user.findUnique({
    where: { username },
    include: {
      participatedGames: true,
    },
  });
};

// Update a user
export const updateUser = async (
  fid: number,
  data: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }
) => {
  return await prisma.user.update({
    where: { fid },
    data,
  });
};

// Delete a user
export const deleteUser = async (fid: number) => {
  return await prisma.user.delete({
    where: { fid },
  });
};

// List all users
export const listUsers = async () => {
  return await prisma.user.findMany({
    include: {
      participatedGames: true,
    },
  });
};

export const fetchTopUsers = async (
  limit = 5
): Promise<{
  users: User[];
  totalCount: number;
}> => {
  const result = await prisma.$transaction([
    prisma.user.findMany({
      take: limit,
      orderBy: {
        fid: "asc",
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users: result[0],
    totalCount: result[1],
  };
};
