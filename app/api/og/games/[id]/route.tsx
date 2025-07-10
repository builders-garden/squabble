import { env } from "@/lib/env";
import { loadGoogleFont, loadImage } from "@/lib/og-utils";
import { getGameById } from "@/lib/prisma/games";
import { fetchTopUsers } from "@/lib/prisma/user";
import { formatAvatarUrl } from "@/lib/utils";
import { ImageResponse } from "next/og";

// Force dynamic rendering to ensure fresh image generation on each request
export const dynamic = "force-dynamic";

// Define the dimensions for the generated OpenGraph image
const size = {
  width: 1200,
  height: 800,
};

/**
 * GET handler for generating dynamic OpenGraph images
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the ID
 * @returns ImageResponse - A dynamically generated image for OpenGraph
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // Extract the ID from the route parameters
    const { id } = await params;

    // Get the application's base URL from environment variables
    const appUrl = env.NEXT_PUBLIC_URL;

    // Load the logo image from the public directory
    const logoImage = await loadImage(`${appUrl}/images/squabble-cover.png`);
    const usdcLogo = await loadImage(`${appUrl}/images/usdc-logo.png`);

    const fontDataBold = await loadGoogleFont(
      "Inter&weight=700",
      "Spot Available! Ready! Not staked USDC Player Real-time scrabble game"
    );

    const game = await getGameById(id);

    if (!game) {
      throw new Error("Game not found");
    }

    const { users: topUsers, totalCount } = await fetchTopUsers();

    // Load participant avatars
    const participantAvatars = await Promise.all(
      game.participants.slice(0, 6).map(async (participant) => {
        try {
          return participant.user.avatarUrl
            ? await loadImage(formatAvatarUrl(participant.user.avatarUrl))
            : null;
        } catch (e) {
          return null;
        }
      })
    );

    // Load top user avatars
    const topUserAvatars = await Promise.all(
      topUsers.slice(0, 5).map(async (user) => {
        try {
          return user.avatarUrl
            ? await loadImage(formatAvatarUrl(user.avatarUrl))
            : null;
        } catch (e) {
          return null;
        }
      })
    );

    // Generate and return the image response with the composed elements
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#1B7A6E",
            padding: "64px",
            color: "white",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "48px",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "48px",
              }}
            >
              <img
                src={logoImage}
                alt="Squabble Logo"
                width="900"
                height="243"
                style={{
                  objectFit: "contain",
                }}
              />

              {game.betAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      padding: "16px 32px",
                      borderRadius: "999px",
                      border: "4px solid #ffffff",
                      fontSize: "48px",
                      fontFamily: "Inter",
                      fontWeight: 900,
                      color: "#ffffff",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <img
                      src={usdcLogo}
                      alt="USDC"
                      width="64"
                      height="64"
                      style={{
                        borderRadius: "50%",
                      }}
                    />
                    5 USDC
                  </div>
                )}
            </div>
          </div>

          {/* Top Users Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginTop: "auto",
              paddingTop: "48px",
              width: "100%",
            }}
          >
            {/* Top Users Avatars */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "-24px",
              }}
            >
              {topUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.fid}
                  style={{
                    display: "flex",
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "4px solid #C8EFE3",
                    backgroundColor: "#1B7A6E",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: index > 0 ? "-12px" : "0",
                    zIndex: 10 - index,
                  }}
                >
                  {user.avatarUrl && topUserAvatars[index] && (
                    <img
                      src={topUserAvatars[index] as string}
                      alt={`Top player ${index + 1}`}
                      width="80"
                      height="80"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Total Count Text */}
            <div
              style={{
                display: "flex",
                fontSize: "36px",
                fontFamily: "Inter",
                fontWeight: 700,
                color: "#C8EFE3",
              }}
            >
              +{Math.max(0, totalCount - 5)} players
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        // Configure the custom font for use in the image
        fonts: [
          {
            name: "Inter",
            data: fontDataBold,
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (e) {
    // Log and handle any errors during image generation
    console.log(`Failed to generate game preview image`, e);
    return new Response(`Failed to generate game preview image`, {
      status: 500,
    });
  }
}
