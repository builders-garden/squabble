import App from "@/components/App";
import { env } from "@/lib/env";
import { Metadata } from "next";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata(
  {
    params,
  }: {
    params: { id: string };
  }
): Promise<Metadata> {
  const requestId = params.id;
  const imageUrl = new URL(`${appUrl}/api/og/games/${requestId}`).toString();

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
      description: "Squabble is a game of words",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
