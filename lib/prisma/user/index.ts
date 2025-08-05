import { User } from "@prisma/client";
import { fetchUserFromNeynar } from "@/lib/neynar";
import { prisma } from "@/lib/prisma/client";
import { formatAvatarUrl } from "@/lib/utils";

// Create or update a user
export const createOrUpdateUser = async ({
  fid,
  displayName,
  username,
  avatarUrl,
  referrerFid,
}: {
  fid: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  referrerFid?: number;
}) => {
  return await prisma.user.upsert({
    where: { fid },
    update: {
      displayName,
      username,
      avatarUrl: formatAvatarUrl(avatarUrl),
      referrerFid,
    },
    create: {
      fid,
      displayName,
      username,
      avatarUrl: formatAvatarUrl(avatarUrl),
      referrerFid,
    },
  });
};

/**
 * Get a user by their fid, or create a new user if they don't exist.
 *
 * This function gets a user by their fid, or creates a new user if they don't exist.
 * It takes a fid and a referrerFid, and returns the user.
 *
 * @param fid - The fid of the user to get or create
 * @param referrerFid - The fid of the referrer user
 * @returns The user if found, otherwise the created user
 */
export const getOrCreateUserFromFid = async (
  fid: number,
  referrerFid?: number,
): Promise<User> => {
  if (!fid) throw new Error("Fid is required");
  const user = await getUserByFid(fid);
  if (!user) {
    const userFromNeynar = await fetchUserFromNeynar(fid.toString());
    if (!userFromNeynar) throw new Error("Farcaster user not found in Neynar");

    const dbUser = await createOrUpdateUser({
      fid,
      username: userFromNeynar.username,
      displayName: userFromNeynar.display_name,
      avatarUrl: userFromNeynar.pfp_url || "",
      referrerFid: referrerFid ? referrerFid : undefined,
    });

    return dbUser;
  }
  return user;
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
  },
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
  limit = 5,
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
