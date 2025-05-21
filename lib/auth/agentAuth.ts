export function checkAgentSecret(req: Request) {
  const headerSecret = req.headers.get("authorization");
  const agentSecret = process.env.AGENT_SECRET;
  return headerSecret && agentSecret && headerSecret === agentSecret;
}
