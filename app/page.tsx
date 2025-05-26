import { Metadata } from "next";
import dynamic from "next/dynamic";
import { env } from "@/lib/env";
import { OG_IMAGE_SIZE } from "@/lib/constants";

const Home = dynamic(() => import("@/components/Home"), {
  ssr: false,
});

const appUrl = env.NEXT_PUBLIC_URL;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const frame = (_searchParams: {
  [key: string]: string | string[] | undefined;
}) => {
  const searchParamsString = Object.entries(_searchParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const { userId } = _searchParams;
  const buttonTitle = "Play Squabble";

  const imageUrl = userId
    ? `${appUrl}/api/og/share/${userId}`
    : `${appUrl}/images/feed.png`;

  return {
    version: "next",
    imageUrl,
    button: {
      title: buttonTitle,
      action: {
        type: "launch_frame",
        name: "Squabble",
        url: `${appUrl}/${searchParamsString ? `?${searchParamsString}` : ""}`,
        splashImageUrl: `${appUrl}/images/splash.png`,
        splashBackgroundColor: "#0d0d0d",
      },
    },
  };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const _searchParams = await searchParams;
  const { userId } = _searchParams;
  const ogTitle = "Play Squabble";
  const imageUrl = userId
    ? `${appUrl}/api/og/share/${userId}`
    : `${appUrl}/images/feed.png`;

  return {
    title: ogTitle,
    openGraph: {
      title: ogTitle,
      description: "Play Squabble! 🎲",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: OG_IMAGE_SIZE.width,
          height: OG_IMAGE_SIZE.height,
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame(_searchParams)),
    },
  };
}
export default function HomePage() {
  return <Home />;
}
