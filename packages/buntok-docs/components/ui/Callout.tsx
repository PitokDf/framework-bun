"use client";

import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";

interface CalloutProps {
  type?: "info" | "warning" | "tip" | "error";
  title?: string;
  children: React.ReactNode;
}

const calloutConfig = {
  info: {
    icon: Info,
    title: "Info",
    className: "callout-info",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    title: "Warning",
    className: "callout-warning",
    iconColor: "text-yellow-500",
  },
  tip: {
    icon: Lightbulb,
    title: "Tip",
    className: "callout-tip",
    iconColor: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    title: "Error",
    className: "callout-error",
    iconColor: "text-red-500",
  },
};

export function Callout({
  type = "info",
  title,
  children,
}: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;

  return (
    <div className={`callout ${config.className} my-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold mb-1">{displayTitle}</div>
          <div className="text-sm text-text-secondary leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
