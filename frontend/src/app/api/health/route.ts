import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

export async function GET() {
  const env = validateEnv();

  return NextResponse.json({
    status: env.valid ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "unknown",
    checks: {
      env: env.valid ? "pass" : "fail",
      missingVars: env.missing,
    },
  });
}
