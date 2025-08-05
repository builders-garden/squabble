import { env } from "@/lib/env";

/**
 * Get the farcaster manifest for the miniapp, generate yours from Farcaster Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 * @returns The farcaster manifest for the farcaster miniapp
 */
export async function getFarcasterManifest() {
  let miniappName = "Squabble";
  let noindex = true;
  const appUrl = env.NEXT_PUBLIC_URL;
  if (appUrl === "https://squabble.lol") {
    noindex = false;
  } else if (appUrl.includes("ngrok") || appUrl.includes("tunnel")) {
    miniappName = "Squabble Local";
  }
  return {
    accountAssociation: {
      header: env.NEXT_PUBLIC_FARCASTER_HEADER,
      payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
      signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    },
    miniapp: {
      version: "1",
      name: miniappName,
      iconUrl: `${appUrl}/images/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/images/feed.png`,
      buttonTitle: `Play Squabble`,
      splashImageUrl: `${appUrl}/images/splash.png`,
      splashBackgroundColor: "#1B7A6E",
      webhookUrl: `${appUrl}/api/webhook`,
      // Metadata https://github.com/farcasterxyz/miniapps/discussions/191
      subtitle: "Fast-paced social word game", // 30 characters, no emojis or special characters, short description under app name
      description: "Outspell your friends, in real time.", // 170 characters, no emojis or special characters, promotional message displayed on Mini App Page
      primaryCategory: "social",
      tags: ["words", "game", "word-game"], // up to 5 tags, filtering/search tags
      tagline: "Fast-paced social word game", // 30 characters, marketing tagline should be punchy and descriptive
      ogTitle: `${miniappName}`, // 30 characters, app name + short tag, Title case, no emojis
      ogDescription: "Outspell your friends, in real time.", // 100 characters, summarize core benefits in 1-2 lines
      screenshotUrls: [
        // 1284 x 2778, visual previews of the app, max 3 screenshots
        `${appUrl}/images/feed.png`,
      ],
      heroImageUrl: `${appUrl}/images/feed.png`, // 1200 x 630px (1.91:1), promotional display image on top of the mini app store
      ogImageUrl: `${appUrl}/images/feed.png`, // 1200 x 630px (1.91:1), promotional image, same as app hero image
      noindex: noindex,
      requiredChains: ["eip155:1", "eip155:8453"],
      requiredCapabilities: ["wallet.getEthereumProvider"],
    },
  };
}
