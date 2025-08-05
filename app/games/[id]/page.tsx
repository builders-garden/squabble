import { Metadata } from "next";
import GamePage from "@/components/pages/game";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const gameId = params.id;

  const imageUrl = `${appUrl}/api/og/games/${gameId}`;
  const farcasterMiniapp = {
    version: "next",
    imageUrl,
    button: {
      title: "Play Squabble",
      action: {
        type: "launch_frame",
        name: "Squabble",
        url: `${appUrl}/games/${gameId}`,
        splashImageUrl: `${appUrl}/images/icon.png`,
        splashBackgroundColor: "#1B7A6E",
      },
    },
  };

  return {
    title: "Squabble",
    openGraph: {
      title: "Squabble",
      description: "Outspell your friends, in real time.",
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    other: {
      "fc:miniapp": JSON.stringify(farcasterMiniapp),
    },
  };
}

export default function Game({ params }: { params: { id: string } }) {
  return <GamePage params={params} />;
}
