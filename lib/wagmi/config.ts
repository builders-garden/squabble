import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { getDefaultConfig } from "@daimo/pay";

export const config = createConfig(
  getDefaultConfig({
    appName: "Squabble Game",
    connectors: [miniAppConnector()],
  })
);
