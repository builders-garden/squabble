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
    const logoImage = await loadImage(`${appUrl}/images/icon.png`);
    const usdcLogo = await loadImage(`${appUrl}/images/usdc-logo.png`);

    const fontDataBold = await loadGoogleFont(
      "Inter&weight=700",
      "Spot Available! Ready! Not staked USDC Player Real-time scrabble game"
    );

    const luckiestGuyFont = await loadGoogleFont("Luckiest+Guy", "SQUABBLE");

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
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              marginBottom: "64px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <img
                  src={logoImage}
                  alt="Squabble Logo"
                  width="96"
                  height="96"
                />
                <div
                  style={{
                    display: "flex",
                    fontFamily: '"Luckiest Guy"',
                    fontSize: "72px",
                    letterSpacing: "0.05em",
                  }}
                >
                  SQUABBLE
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Inter",
                  fontSize: "24px",
                  color: "#C8EFE3",
                  fontWeight: 700,
                }}
              >
                Outspell your friends in real-time
              </div>
            </div>

            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                padding: "16px 32px",
                borderRadius: "999px",
                border: "3px solid #C8EFE3",
                fontSize: "32px",
                fontFamily: "Inter",
                fontWeight: 700,
                color: "#34D399",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <img
                src={usdcLogo}
                alt="USDC"
                width="32"
                height="32"
                style={{
                  borderRadius: "50%",
                }}
              />
              {game.betAmount === 0 ? "FREE" : `${game.betAmount} USDC`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              width: "100%",
            }}
          >
            {/* First row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "24px",
                width: "100%",
              }}
            >
              {[0, 1, 2].map((index) => {
                const participant = game.participants[index];
                return participant ? (
                  <div
                    key={participant.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "24px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      border: "3px solid #C8EFE3",
                      flex: 1,
                      height: "120px",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        display: "flex",
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "3px solid #C8EFE3",
                        backgroundColor: "#1B7A6E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {participantAvatars[index] ? (
                        <img
                          src={participantAvatars[index] as string}
                          alt="Avatar"
                          width="72"
                          height="72"
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      ) : null}
                    </div>

                    {/* Player Info */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          fontSize: "24px",
                          fontFamily: "Inter",
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {participant.user.displayName ||
                          participant.user.username ||
                          `Player ${participant.fid}`}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: "20px",
                          fontFamily: "Inter",
                          fontWeight: 700,
                          color: participant.paid ? "#34D399" : "#FDE68A",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {participant.paid ? "Ready!" : "Not staked"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "24px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "3px dashed rgba(255, 255, 255, 0.15)",
                      flex: 1,
                      height: "120px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: "24px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      Spot Available!
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Second row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "24px",
                width: "100%",
              }}
            >
              {[3, 4, 5].map((index) => {
                const participant = game.participants[index];
                return participant ? (
                  <div
                    key={participant.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "24px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      border: "3px solid #C8EFE3",
                      flex: 1,
                      height: "120px",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        display: "flex",
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "3px solid #C8EFE3",
                        backgroundColor: "#1B7A6E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {participantAvatars[index] ? (
                        <img
                          src={participantAvatars[index] as string}
                          alt="Avatar"
                          width="72"
                          height="72"
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      ) : null}
                    </div>

                    {/* Player Info */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          fontSize: "24px",
                          fontFamily: "Inter",
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {participant.user.displayName ||
                          participant.user.username ||
                          `Player ${participant.fid}`}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: "20px",
                          fontFamily: "Inter",
                          fontWeight: 700,
                          color: participant.paid ? "#34D399" : "#FDE68A",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {participant.paid ? "Ready!" : "Not staked"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "24px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "3px dashed rgba(255, 255, 255, 0.15)",
                      flex: 1,
                      height: "120px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: "24px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      Spot Available!
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Users Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "auto",
              paddingTop: "24px",
            }}
          >
            {/* Top Users Avatars */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "-12px",
              }}
            >
              {topUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.fid}
                  style={{
                    display: "flex",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "3px solid #C8EFE3",
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
                      width="48"
                      height="48"
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
                fontSize: "20px",
                fontFamily: "Inter",
                fontWeight: 700,
                color: "#C8EFE3",
              }}
            >
              +{Math.max(0, totalCount - 5)} others
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        // Configure the custom font for use in the image
        fonts: [
          {
            name: "Luckiest Guy",
            data: luckiestGuyFont,
            style: "normal",
            weight: 400,
          },
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
