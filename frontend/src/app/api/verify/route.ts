import { NextRequest, NextResponse } from "next/server";

interface VerifyRequestBody {
  address: string;
}

const MOCK_AGENTS: Record<
  string,
  {
    name: string;
    status: string;
    capabilities: string[];
    registeredAt: number;
    stakeAmount: string;
    score: number;
    attestationCount: number;
    flags: string[];
  }
> = {
  GAVQHQLCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWE: {
    name: "TextMaster Pro",
    status: "active",
    capabilities: ["text-generation", "text-analysis", "translation"],
    registeredAt: 1710288000,
    stakeAmount: "500",
    score: 8750,
    attestationCount: 12,
    flags: [],
  },
  GCXHM7JONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCX: {
    name: "PixelForge AI",
    status: "active",
    capabilities: ["image-generation", "image-recognition"],
    registeredAt: 1714003200,
    stakeAmount: "250",
    score: 6200,
    attestationCount: 5,
    flags: ["Low attestation count"],
  },
  GDONASVQD3YXFUSGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JON: {
    name: "DataHarvest",
    status: "active",
    capabilities: ["data-retrieval", "data-analysis", "web-scraping"],
    registeredAt: 1717632000,
    stakeAmount: "150",
    score: 4800,
    attestationCount: 3,
    flags: ["Below minimum recommended stake", "Low attestation count"],
  },
  GGRDXLP5TTTHCV3P5KIMDLWFZC4QQWEBHQLCXHM7JONASVQD3YXFUSGRD: {
    name: "OmniCreate",
    status: "suspended",
    capabilities: ["image-generation", "text-generation", "data-retrieval"],
    registeredAt: 1711497600,
    stakeAmount: "350",
    score: 7100,
    attestationCount: 8,
    flags: ["Agent currently suspended"],
  },
};

function getTier(score: number): string {
  if (score <= 2000) return "unverified";
  if (score <= 5000) return "emerging";
  if (score <= 7500) return "established";
  if (score <= 9000) return "trusted";
  return "elite";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyRequestBody;

    if (!body.address || typeof body.address !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid address parameter" },
        { status: 400 }
      );
    }

    const address = body.address.trim();

    if (!address.startsWith("G") || address.length < 10) {
      return NextResponse.json(
        { error: "Invalid Stellar address format" },
        { status: 400 }
      );
    }

    // Check mock data first
    const mockAgent = MOCK_AGENTS[address];

    if (mockAgent) {
      return NextResponse.json({
        agent: {
          address,
          name: mockAgent.name,
          status: mockAgent.status,
          capabilities: mockAgent.capabilities,
          registeredAt: mockAgent.registeredAt,
          stakeAmount: mockAgent.stakeAmount,
        },
        score: mockAgent.score,
        tier: getTier(mockAgent.score),
        flags: mockAgent.flags,
        attestationCount: mockAgent.attestationCount,
      });
    }

    // For unknown addresses, return a generated unverified response
    return NextResponse.json({
      agent: {
        address,
        name: `Agent ${address.slice(0, 6)}`,
        status: "active",
        capabilities: [],
        registeredAt: Math.floor(Date.now() / 1000),
        stakeAmount: "100",
      },
      score: 1000,
      tier: "unverified",
      flags: [
        "Newly registered agent",
        "No attestations yet",
        "Minimum stake level",
      ],
      attestationCount: 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
