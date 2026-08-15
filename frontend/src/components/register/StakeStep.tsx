"use client";

import React from "react";

interface StakeStepProps {
  amount: string;
  onChange: (amount: string) => void;
  balance?: string;
}

const MINIMUM_STAKE = 100;
const QUICK_AMOUNTS = [100, 250, 500, 1000];
const MAX_SLIDER = 2000;

export default function StakeStep({ amount, onChange, balance }: StakeStepProps) {
  const numericAmount = parseFloat(amount) || 0;
  const isValid = numericAmount >= MINIMUM_STAKE;
  const balanceNum = balance ? parseFloat(balance) : undefined;
  const exceedsBalance = balanceNum !== undefined && numericAmount > balanceNum;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange(val.toString());
  };

  return (
    <div className="space-y-6">
      {/* Balance display */}
      {balance && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Available Balance</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {parseFloat(balance).toLocaleString()} XLM
          </span>
        </div>
      )}

      {/* Amount input */}
      <div>
        <label htmlFor="stake-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Stake Amount
        </label>
        <div className="relative">
          <input
            id="stake-amount"
            type="number"
            value={amount}
            onChange={(e) => onChange(e.target.value)}
            min={MINIMUM_STAKE}
            step="1"
            placeholder={MINIMUM_STAKE.toString()}
            className={`
              w-full pl-4 pr-16 py-3 text-lg font-medium rounded-lg border
              ${!isValid && amount
                ? "border-red-300 dark:border-red-700 focus:ring-red-500/50"
                : "border-gray-300 dark:border-gray-600 focus:ring-stellar-blue/50 focus:border-stellar-blue"
              }
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 transition-colors
            `}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
            XLM
          </span>
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Minimum: {MINIMUM_STAKE} XLM
          </p>
          {!isValid && amount && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Below minimum stake requirement
            </p>
          )}
          {exceedsBalance && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Exceeds available balance
            </p>
          )}
        </div>
      </div>

      {/* Quick select buttons */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick select</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange(amt.toString())}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                ${numericAmount === amt
                  ? "bg-stellar-blue text-white border-stellar-blue"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-stellar-blue hover:text-stellar-blue"
                }
              `}
            >
              {amt.toLocaleString()} XLM
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div>
        <input
          type="range"
          min={MINIMUM_STAKE}
          max={MAX_SLIDER}
          step={10}
          value={Math.min(numericAmount || MINIMUM_STAKE, MAX_SLIDER)}
          onChange={handleSliderChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-stellar-blue"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>{MINIMUM_STAKE} XLM</span>
          <span>{MAX_SLIDER.toLocaleString()}+ XLM</span>
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">About staking</p>
            <p className="mt-1 text-blue-700 dark:text-blue-400">
              Your stake secures your agent&apos;s reputation on the network. Higher stakes demonstrate
              greater commitment and can improve your trust score. Stakes can be recovered upon
              deregistration after the cooldown period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
