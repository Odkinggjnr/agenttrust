"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import MetadataStep, { type MetadataFormData } from "./MetadataStep";
import CapabilityPicker from "./CapabilityPicker";
import StakeStep from "./StakeStep";

interface RegistrationData {
  name: string;
  description: string;
  endpoint: string;
  metadataUri: string;
  capabilities: string[];
  stakeAmount: number; // in XLM, caller converts to stroops
}

interface RegisterFormProps {
  onComplete: (data: RegistrationData) => void;
  balance?: string;
}

interface FormState {
  metadata: MetadataFormData;
  capabilities: string[];
  stakeAmount: string;
}

const STEPS = [
  { label: "Info", description: "Agent metadata" },
  { label: "Capabilities", description: "What can it do?" },
  { label: "Stake", description: "Secure with XLM" },
  { label: "Review", description: "Confirm details" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentStep;
        const isActive = idx === currentStep;
        const isPending = idx > currentStep;

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${isComplete
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-stellar-blue text-white ring-4 ring-stellar-blue/20"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }
                `}
              >
                {isComplete ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium hidden sm:block ${
                  isActive ? "text-stellar-blue" : isPending ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 ${
                  idx < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function formatCapabilityName(cap: string): string {
  return cap
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function RegisterForm({ onComplete, balance }: RegisterFormProps) {
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    metadata: { name: "", description: "", endpoint: "", metadataUri: "" },
    capabilities: [],
    stakeAmount: "100",
  });

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return formState.metadata.name.trim().length >= 3;
      case 1:
        return formState.capabilities.length > 0;
      case 2:
        return parseFloat(formState.stakeAmount) >= 100;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete({
        name: formState.metadata.name,
        description: formState.metadata.description,
        endpoint: formState.metadata.endpoint,
        metadataUri: formState.metadata.metadataUri,
        capabilities: formState.capabilities,
        stakeAmount: parseFloat(formState.stakeAmount),
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      <div className="min-h-[300px]">
        {step === 0 && (
          <MetadataStep
            data={formState.metadata}
            onChange={(metadata) => setFormState((s) => ({ ...s, metadata }))}
          />
        )}

        {step === 1 && (
          <CapabilityPicker
            selected={formState.capabilities}
            onChange={(capabilities) => setFormState((s) => ({ ...s, capabilities }))}
          />
        )}

        {step === 2 && (
          <StakeStep
            amount={formState.stakeAmount}
            onChange={(stakeAmount) => setFormState((s) => ({ ...s, stakeAmount }))}
            balance={balance}
          />
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Review Registration
            </h3>
            <div className="space-y-4">
              <ReviewSection title="Agent Information">
                <ReviewRow label="Name" value={formState.metadata.name} />
                <ReviewRow label="Description" value={formState.metadata.description || "Not provided"} />
                <ReviewRow label="Endpoint" value={formState.metadata.endpoint || "Not provided"} />
                <ReviewRow label="Metadata URI" value={formState.metadata.metadataUri || "Not provided"} />
              </ReviewSection>
              <ReviewSection title="Capabilities">
                <div className="flex flex-wrap gap-1.5">
                  {formState.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-stellar-light text-stellar-blue dark:bg-stellar-blue/20"
                    >
                      {formatCapabilityName(cap)}
                    </span>
                  ))}
                </div>
              </ReviewSection>
              <ReviewSection title="Stake">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {parseFloat(formState.stakeAmount).toLocaleString()} XLM
                </p>
              </ReviewSection>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canNext()}
        >
          {step === STEPS.length - 1 ? "Register Agent" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100 text-right max-w-xs truncate">
        {value}
      </span>
    </div>
  );
}
