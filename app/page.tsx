import HomePage from "@/components/pages/home";
import { env } from "@/lib/env";
import { Metadata } from "next";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const requestId = params.id;

  const imageUrl = `${appUrl}/images/feed.png`;
  const frame = {
    version: "next",
    imageUrl,
    button: {
      title: "Play Squabble",
      action: {
        type: "launch_frame",
        name: "Squabble",
        url: `${appUrl}/games/${requestId}`,
        splashImageUrl: `${appUrl}/images/icon.png`,
        splashBackgroundColor: "#7DDAC3",
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
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <HomePage />;
}
