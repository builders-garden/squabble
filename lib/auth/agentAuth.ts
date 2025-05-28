import { env } from "../env";

export function checkAgentSecret(req: Request) {
  const headerSecret = req.headers.get("authorization");
  const agentSecret = env.AGENT_SECRET;
  return headerSecret && agentSecret && headerSecret === agentSecret;
}
