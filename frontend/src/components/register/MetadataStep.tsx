"use client";

import React, { useState } from "react";

export interface MetadataFormData {
  name: string;
  description: string;
  endpoint: string;
  metadataUri: string;
}

interface MetadataStepProps {
  data: MetadataFormData;
  onChange: (data: MetadataFormData) => void;
}

interface FieldError {
  name?: string;
  description?: string;
  endpoint?: string;
  metadataUri?: string;
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export default function MetadataStep({ data, onChange }: MetadataStepProps) {
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (field: keyof MetadataFormData, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Agent name is required";
        if (value.trim().length < 3) return "Name must be at least 3 characters";
        return undefined;
      case "description":
        if (value.length > 500) return "Description must be 500 characters or fewer";
        return undefined;
      case "endpoint":
        if (value && !isValidUrl(value)) return "Please enter a valid URL";
        return undefined;
      case "metadataUri":
        if (value && !value.startsWith("ipfs://") && !isValidUrl(value)) {
          return "Enter a valid URL or IPFS URI";
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (field: keyof MetadataFormData, value: string) => {
    onChange({ ...data, [field]: value });
    if (touched[field]) {
      const error = validate(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof MetadataFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validate(field, data[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const inputClasses = (field: keyof MetadataFormData) => `
    w-full px-3 py-2 text-sm rounded-lg border
    ${errors[field]
      ? "border-red-300 dark:border-red-700 focus:ring-red-500/50 focus:border-red-500"
      : "border-gray-300 dark:border-gray-600 focus:ring-stellar-blue/50 focus:border-stellar-blue"
    }
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 transition-colors
  `;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Agent Name <span className="text-red-500">*</span>
        </label>
        <input
          id="agent-name"
          type="text"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="My AI Agent"
          className={inputClasses("name")}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="agent-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Description
        </label>
        <textarea
          id="agent-description"
          value={data.description}
          onChange={(e) => handleChange("description", e.target.value)}
          onBlur={() => handleBlur("description")}
          placeholder="Describe what your agent does..."
          rows={4}
          className={inputClasses("description")}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className={`text-xs ${data.description.length > 500 ? "text-red-500" : "text-gray-400"}`}>
            {data.description.length}/500
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="agent-endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Endpoint URL
        </label>
        <input
          id="agent-endpoint"
          type="url"
          value={data.endpoint}
          onChange={(e) => handleChange("endpoint", e.target.value)}
          onBlur={() => handleBlur("endpoint")}
          placeholder="https://api.example.com/agent"
          className={inputClasses("endpoint")}
        />
        {errors.endpoint && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.endpoint}</p>
        )}
      </div>

      <div>
        <label htmlFor="agent-metadata" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Metadata URI
        </label>
        <input
          id="agent-metadata"
          type="text"
          value={data.metadataUri}
          onChange={(e) => handleChange("metadataUri", e.target.value)}
          onBlur={() => handleBlur("metadataUri")}
          placeholder="ipfs://... or https://..."
          className={inputClasses("metadataUri")}
        />
        {errors.metadataUri && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metadataUri}</p>
        )}
      </div>
    </div>
  );
}
