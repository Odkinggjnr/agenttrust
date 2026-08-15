"use client";

import React, { useEffect, useState } from "react";
import { getTrustTier, getTierLabel } from "@/types/reputation";

type RingSize = "sm" | "md" | "lg";

interface TrustScoreRingProps {
  score: number; // 0-10000 basis points
  size?: RingSize;
  animated?: boolean;
  showLabel?: boolean;
}

const sizeConfig: Record<RingSize, { px: number; strokeWidth: number; fontSize: string; tierFontSize: string }> = {
  sm: { px: 60, strokeWidth: 4, fontSize: "text-sm", tierFontSize: "text-[8px]" },
  md: { px: 120, strokeWidth: 6, fontSize: "text-2xl", tierFontSize: "text-xs" },
  lg: { px: 200, strokeWidth: 8, fontSize: "text-4xl", tierFontSize: "text-sm" },
};

function getScoreColor(score: number): string {
  if (score <= 2000) return "#EF4444";    // red — unverified
  if (score <= 5000) return "#F97316";    // orange — emerging
  if (score <= 7500) return "#EAB308";    // yellow — established
  if (score <= 9000) return "#22C55E";    // green — trusted
  return "#6366F1";                       // indigo — elite
}

export default function TrustScoreRing({
  score,
  size = "md",
  animated = true,
  showLabel = true,
}: TrustScoreRingProps) {
  const [mounted, setMounted] = useState(!animated);
  const config = sizeConfig[size];
  const halfSize = config.px / 2;
  const radius = halfSize - config.strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(Math.max(score, 0), 10000) / 10000;
  const offset = circumference * (1 - (mounted ? percent : 0));
  const color = getScoreColor(score);
  const tier = getTrustTier(score);
  const tierLabel = getTierLabel(tier);
  const displayScore = (score / 100).toFixed(1); // e.g. 7250 -> "72.5"

  useEffect(() => {
    if (animated) {
      const frame = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [animated]);

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={config.px}
        height={config.px}
        viewBox={`0 0 ${config.px} ${config.px}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Score arc */}
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: offset,
            transition: animated ? "stroke-dashoffset 1.5s ease-out" : "none",
          }}
        />
      </svg>
      {/* Center content overlaid */}
      <div
        className="flex flex-col items-center justify-center"
        style={{
          marginTop: -config.px,
          height: config.px,
          width: config.px,
        }}
      >
        <span className={`${config.fontSize} font-bold text-gray-900 dark:text-gray-100`}>
          {displayScore}
        </span>
        {showLabel && (
          <span
            className={`${config.tierFontSize} font-medium mt-0.5`}
            style={{ color }}
          >
            {tierLabel}
          </span>
        )}
      </div>
    </div>
  );
}
