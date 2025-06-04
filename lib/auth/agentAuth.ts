import { env } from "../env";

export function checkAgentSecret(req: Request) {
  const headerSecret = req.headers.get("x-agent-secret");
  const agentSecret = env.AGENT_SECRET;
  return headerSecret && agentSecret && headerSecret === agentSecret;
}
