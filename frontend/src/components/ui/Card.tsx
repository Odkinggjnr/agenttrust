import React from "react";

interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  header,
  footer,
  children,
  className = "",
  hover = false,
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-gray-200 bg-white
        dark:border-gray-700 dark:bg-gray-900
        ${hover ? "transition-shadow duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600" : ""}
        ${className}
      `}
    >
      {header && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          {header}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}
