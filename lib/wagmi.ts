import { getDefaultConfig } from "@daimo/pay";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { basePreconf } from "viem/chains";
import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";

const chains = [basePreconf] as const;

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Squabble",
    appIcon: "https://squabble.lol/images/icon.png",
    appDescription: "Squabble",
    appUrl: "https://squabble.lol",
    ssr: true,
    chains: chains,
    transports: {
      [basePreconf.id]: http(),
    },
    connectors: [
      miniAppConnector(),
      coinbaseWallet({
        appName: "Squabble",
      }),
    ],
  }),
);

/**
 * Gets the chain object for the given chain id.
 * @param chainId - Chain id of the target EVM chain.
 * @returns Viem's chain object.
 */
export function getChainFromChainId(chainId: number) {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain;
    }
  }

  return undefined;
}
