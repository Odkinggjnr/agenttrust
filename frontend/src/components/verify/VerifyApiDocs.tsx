"use client";

import React, { useState } from "react";

type TabKey = "curl" | "javascript" | "python";

const tabs: { key: TabKey; label: string }[] = [
  { key: "curl", label: "cURL" },
  { key: "javascript", label: "JavaScript" },
  { key: "python", label: "Python" },
];

const codeExamples: Record<TabKey, { code: string; language: string }> = {
  curl: {
    language: "bash",
    code: `curl -X GET "https://api.agenttrust.io/v1/verify?address=GABCD...WXYZ" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Response
{
  "agent": {
    "address": "GABCD...WXYZ",
    "name": "My Agent",
    "status": "active",
    "capabilities": ["text-generation", "data-analysis"],
    "registeredAt": "2026-01-15T10:30:00Z",
    "stakeAmount": 500
  },
  "score": {
    "overall": 78.5,
    "successRate": 95.2,
    "volumeScore": 62.0,
    "consistencyScore": 80.0,
    "ageScore": 45.0,
    "tier": "trusted"
  },
  "tier": "trusted",
  "flags": ["All checks passed"]
}`,
  },
  javascript: {
    language: "javascript",
    code: `import { AgentTrustClient } from "@agenttrust/sdk";

const client = new AgentTrustClient({
  apiKey: "YOUR_API_KEY",
  network: "mainnet",  // or "testnet"
});

// Verify an agent
const result = await client.verify("GABCD...WXYZ");

console.log(result.score.overall);  // 78.5
console.log(result.tier);           // "trusted"
console.log(result.flags);          // ["All checks passed"]

// Check if agent meets a threshold
if (result.score.overall >= 60) {
  console.log("Agent is trustworthy for transactions");
}

// Get detailed score breakdown
const { successRate, volumeScore, consistencyScore, ageScore } = result.score;`,
  },
  python: {
    language: "python",
    code: `from agenttrust import AgentTrustClient

client = AgentTrustClient(
    api_key="YOUR_API_KEY",
    network="mainnet"  # or "testnet"
)

# Verify an agent
result = client.verify("GABCD...WXYZ")

print(result.score.overall)   # 78.5
print(result.tier)            # "trusted"
print(result.flags)           # ["All checks passed"]

# Check if agent meets a threshold
if result.score.overall >= 60:
    print("Agent is trustworthy for transactions")

# Get detailed score breakdown
breakdown = result.score
print(f"Success Rate: {breakdown.success_rate}")
print(f"Volume Score: {breakdown.volume_score}")`,
  },
};

function highlightSyntax(code: string, language: string): React.ReactNode[] {
  const lines = code.split("\n");

  return lines.map((line, i) => {
    let highlighted = line;

    // Comments
    if (language === "bash" && line.trimStart().startsWith("#")) {
      return (
        <div key={i}>
          <span className="text-gray-500">{line}</span>
        </div>
      );
    }
    if ((language === "javascript" || language === "python") && line.trimStart().startsWith("//")) {
      return (
        <div key={i}>
          <span className="text-gray-500">{line}</span>
        </div>
      );
    }
    if (language === "python" && line.trimStart().startsWith("#")) {
      return (
        <div key={i}>
          <span className="text-gray-500">{line}</span>
        </div>
      );
    }

    // Simple token-based highlighting
    const parts: React.ReactNode[] = [];
    let remaining = highlighted;
    let partIdx = 0;

    // Strings
    const stringPattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    let lastIdx = 0;
    let match;

    while ((match = stringPattern.exec(remaining)) !== null) {
      if (match.index > lastIdx) {
        parts.push(
          <span key={partIdx++}>{highlightKeywords(remaining.slice(lastIdx, match.index), language)}</span>
        );
      }
      parts.push(
        <span key={partIdx++} className="text-green-400">
          {match[0]}
        </span>
      );
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < remaining.length) {
      parts.push(
        <span key={partIdx++}>{highlightKeywords(remaining.slice(lastIdx), language)}</span>
      );
    }

    return <div key={i}>{parts.length > 0 ? parts : line || " "}</div>;
  });
}

function highlightKeywords(text: string, language: string): React.ReactNode {
  const jsKeywords = /\b(const|let|var|import|from|await|async|if|else|console|function|return|new)\b/g;
  const pyKeywords = /\b(from|import|if|else|print|def|class|return|True|False|None)\b/g;
  const bashKeywords = /\b(curl|echo)\b/g;

  const pattern = language === "python" ? pyKeywords : language === "bash" ? bashKeywords : jsKeywords;

  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match;
  let idx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={idx++}>{text.slice(lastIdx, match.index)}</span>);
    }
    parts.push(
      <span key={idx++} className="text-purple-400 font-medium">
        {match[0]}
      </span>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(<span key={idx++}>{text.slice(lastIdx)}</span>);
  }

  return <>{parts}</>;
}

export default function VerifyApiDocs() {
  const [activeTab, setActiveTab] = useState<TabKey>("curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeExamples[activeTab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const example = codeExamples[activeTab];

  return (
    <div className="w-full">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-4 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b-2 border-stellar-blue"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="mr-3 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Code block */}
        <div className="overflow-x-auto bg-gray-950 p-4">
          <pre className="text-sm font-mono leading-relaxed text-gray-300">
            <code>{highlightSyntax(example.code, example.language)}</code>
          </pre>
        </div>
      </div>

      {/* API info */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          API Reference
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Endpoint</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Method</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">/v1/verify</td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">GET</span></td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">Verify an agent&apos;s trust score</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">/v1/agents</td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">GET</span></td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">List all registered agents</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">/v1/agents/:id</td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">GET</span></td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">Get agent details by ID</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">/v1/attestations</td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">POST</span></td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">Create a new attestation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
