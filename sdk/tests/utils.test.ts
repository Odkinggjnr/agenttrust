import { Keypair } from "@stellar/stellar-sdk";
import {
  formatScore,
  formatXLM,
  getTierFromScore,
  getTierScore,
  isValidStellarAddress,
} from "../src/utils";

describe("SDK utilities", () => {
  test.each([
    [0, "unverified"],
    [2000, "unverified"],
    [2001, "emerging"],
    [5001, "established"],
    [7501, "trusted"],
    [9001, "elite"],
  ] as const)("maps score %i to %s", (score, tier) => {
    expect(getTierFromScore(score)).toBe(tier);
    expect(getTierScore(tier)).toBeLessThanOrEqual(score);
  });

  it("validates encoded Stellar account addresses", () => {
    expect(isValidStellarAddress(Keypair.random().publicKey())).toBe(true);
    expect(isValidStellarAddress("G".repeat(56))).toBe(false);
    expect(isValidStellarAddress("not-an-address")).toBe(false);
  });

  it("formats scores and stroop amounts", () => {
    expect(formatScore(8750)).toBe("87.5");
    expect(formatXLM("1000000000")).toBe("100.00");
  });
});
