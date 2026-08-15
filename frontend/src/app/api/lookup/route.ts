import { NextRequest, NextResponse } from "next/server";

function getTier(score: number): string {
  if (score <= 2000) return "unverified";
  if (score <= 5000) return "emerging";
  if (score <= 7500) return "established";
  if (score <= 9000) return "trusted";
  return "elite";
}

const KNOWN_AGENTS: Record<
  string,
  { score: number; status: string; exists: boolean }
> = {
  GAVQHQLCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWE: {
    score: 8750,
    status: "active",
    exists: true,
  },
  GCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCX: {
    score: 6200,
    status: "active",
    exists: true,
  },
  GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON: {
    score: 4800,
    status: "active",
    exists: true,
  },
  GEYXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YX: {
    score: 9200,
    status: "active",
    exists: true,
  },
  GFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUS: {
    score: 1500,
    status: "active",
    exists: true,
  },
  GGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUSGRD: {
    score: 7100,
    status: "suspended",
    exists: true,
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "Missing address query parameter" },
      { status: 400 }
    );
  }

  const trimmed = address.trim();

  if (!trimmed.startsWith("G") || trimmed.length < 10) {
    return NextResponse.json(
      { error: "Invalid Stellar address format" },
      { status: 400 }
    );
  }

  const agent = KNOWN_AGENTS[trimmed];

  if (agent) {
    return NextResponse.json({
      address: trimmed,
      score: agent.score,
      tier: getTier(agent.score),
      status: agent.status,
      exists: true,
    });
  }

  return NextResponse.json({
    address: trimmed,
    score: 0,
    tier: "unverified",
    status: "unknown",
    exists: false,
  });
}
