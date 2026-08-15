import { AgentTrustClient } from "./client";
import { MiddlewareConfig, AgentTrustResult } from "./types";
import { getTierScore } from "./utils";

function defaultExtractAddress(req: any): string | null {
  const headers = req.headers;
  if (headers) {
    if (typeof headers === "object") {
      const agentAddr =
        headers["x-agent-address"] ?? headers["X-Agent-Address"];
      if (agentAddr) return String(agentAddr);

      const payerAddr =
        headers["x-402-payer"] ?? headers["X-402-Payer"];
      if (payerAddr) return String(payerAddr);
    }
    if (typeof headers.get === "function") {
      const agentAddr = headers.get("x-agent-address");
      if (agentAddr) return String(agentAddr);

      const payerAddr = headers.get("x-402-payer");
      if (payerAddr) return String(payerAddr);
    }
  }

  if (req.query && req.query.agent) {
    return String(req.query.agent);
  }

  return null;
}

export function agentTrustMiddleware(config: MiddlewareConfig = {}) {
  const client = new AgentTrustClient({ network: "testnet" });
  const minScore = config.minScore ?? 0;
  const minTierScore = config.minTier ? getTierScore(config.minTier) : 0;
  const effectiveMinScore = Math.max(minScore, minTierScore);

  return async (req: any, res: any, next: any) => {
    const extract = config.extractAddress ?? defaultExtractAddress;
    const address = extract(req);

    if (!address) {
      return next();
    }

    try {
      const result: AgentTrustResult = await client.verify(address);

      req.agentTrust = result;

      if (!result.exists) {
        return res.status(402).json({
          error: "agent_not_found",
          message: "Agent not registered in AgentTrust",
        });
      }

      if (config.requireActive !== false && result.status !== "active") {
        return res.status(402).json({
          error: "agent_not_active",
          message: `Agent status: ${result.status}`,
        });
      }

      if (result.score < effectiveMinScore) {
        if (config.onRejection) {
          return config.onRejection(req, res, result);
        }
        return res.status(402).json({
          error: "insufficient_trust",
          message: `Agent trust score ${result.score} below minimum ${effectiveMinScore}`,
          score: result.score,
          tier: result.tier,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function agentTrustHono(config: MiddlewareConfig = {}) {
  const client = new AgentTrustClient({ network: "testnet" });
  const minScore = config.minScore ?? 0;
  const minTierScore = config.minTier ? getTierScore(config.minTier) : 0;
  const effectiveMinScore = Math.max(minScore, minTierScore);

  return async (c: any, next: any) => {
    const extract =
      config.extractAddress ??
      ((req: any) => {
        return req.header("x-agent-address") || req.header("x-402-payer") || null;
      });
    const address = extract(c.req);

    if (!address) {
      return next();
    }

    try {
      const result: AgentTrustResult = await client.verify(address);
      c.set("agentTrust", result);

      if (!result.exists || (config.requireActive !== false && result.status !== "active")) {
        return c.json({ error: "agent_not_found_or_inactive" }, 402);
      }

      if (result.score < effectiveMinScore) {
        return c.json(
          {
            error: "insufficient_trust",
            score: result.score,
            tier: result.tier,
            minimum: effectiveMinScore,
          },
          402
        );
      }

      await next();
    } catch (err) {
      throw err;
    }
  };
}

/** Compatibility namespace used by the documented Express and Hono examples. */
export const AgentTrustMiddleware = {
  express: agentTrustMiddleware,
  hono: agentTrustHono,
};
