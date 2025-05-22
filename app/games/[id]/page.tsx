import { Metadata } from "next";
import { env } from "@/lib/env";
import GamePage from "@/components/pages/game";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const requestId = params.id;

  //const imageUrl = new URL(`${appUrl}/api/og/songs/${requestId}`).toString();
  const imageUrl = `${appUrl}/images/feed.png`;
  const frame = {
    version: "next",
    imageUrl,
    button: {
      title: "Launch App",
      action: {
        type: "launch_frame",
        name: "Squabble",
        url: `${appUrl}/games/${requestId}`,
        splashImageUrl: `${appUrl}/images/icon.png`,
        splashBackgroundColor: "#000000",
      },
    },
  };

  return {
    title: "Squabble",
    openGraph: {
      title: "Squabble",
      description: "Squabble is a game of words and wits.",
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Game() {
  return <GamePage />;
}
