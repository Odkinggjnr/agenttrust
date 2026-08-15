"use client";

import React from "react";
import { CAPABILITIES } from "@/types/agent";
import type { CapabilityCategory } from "@/types/agent";

interface CapabilityPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const categoryIcons: Record<CapabilityCategory, React.ReactNode> = {
  text: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  image: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  data: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  payment: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const categoryLabels: Record<CapabilityCategory, string> = {
  text: "Text",
  image: "Image",
  data: "Data",
  payment: "Payment",
};

// Group CAPABILITIES by category
const capsByCategory = CAPABILITIES.reduce<Record<CapabilityCategory, typeof CAPABILITIES>>((acc, cap) => {
  if (!acc[cap.category]) acc[cap.category] = [];
  acc[cap.category].push(cap);
  return acc;
}, {} as Record<CapabilityCategory, typeof CAPABILITIES>);

export default function CapabilityPicker({ selected, onChange }: CapabilityPickerProps) {
  const toggleCapability = (capId: string) => {
    if (selected.includes(capId)) {
      onChange(selected.filter((c) => c !== capId));
    } else {
      onChange([...selected, capId]);
    }
  };

  return (
    <div className="space-y-6">
      {(Object.entries(capsByCategory) as [CapabilityCategory, typeof CAPABILITIES][]).map(
        ([category, capabilities]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-500 dark:text-gray-400">{categoryIcons[category]}</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {categoryLabels[category]}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {capabilities.map((cap) => {
                const isSelected = selected.includes(cap.id);
                return (
                  <label
                    key={cap.id}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected
                        ? "border-stellar-blue bg-stellar-light/50 dark:bg-stellar-blue/10 dark:border-stellar-blue"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCapability(cap.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-stellar-blue focus:ring-stellar-blue/50"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cap.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {cap.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )
      )}
      {selected.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selected.length} capabilit{selected.length === 1 ? "y" : "ies"} selected
        </p>
      )}
    </div>
  );
}
