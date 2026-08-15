import React from "react";

type TagSize = "sm" | "md";

interface CapabilityTagsProps {
  capabilities: string[];
  size?: TagSize;
}

const categoryStyles: Record<string, { bg: string; icon: string }> = {
  // Text capabilities
  "text-generation": { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: "T" },
  "text-analysis": { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: "A" },
  translation: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: "Tr" },
  // Image capabilities
  "image-generation": { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: "Im" },
  "image-recognition": { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: "Ir" },
  // Data capabilities
  "data-retrieval": { bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: "Dr" },
  "data-analysis": { bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: "Da" },
  "web-scraping": { bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: "Ws" },
  // Payment capabilities
  "payment-processing": { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: "Pp" },
  invoicing: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: "Iv" },
};

const defaultStyle = {
  bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  icon: "?",
};

function formatCapabilityName(cap: string): string {
  return cap
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CapabilityTags({ capabilities, size = "md" }: CapabilityTagsProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <div className="flex flex-wrap gap-1.5">
      {capabilities.map((cap) => {
        const style = categoryStyles[cap] || defaultStyle;
        return (
          <span
            key={cap}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${style.bg} ${sizeClasses}`}
          >
            <span className="font-bold opacity-70">{style.icon}</span>
            {formatCapabilityName(cap)}
          </span>
        );
      })}
    </div>
  );
}
