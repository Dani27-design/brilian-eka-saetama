import React from "react";

interface StatusBadgeProps {
  status?: string;
  colorClass?: string;
  children?: React.ReactNode;
  label?: string;
}

/**
 * Standard status badge component with pill badge styling.
 * Color mapping is passed via colorClass prop from parent component's statusColor/colorMap object.
 */
export default function StatusBadge({
  status,
  colorClass = "",
  children,
  label,
}: StatusBadgeProps) {
  // colorMap reference: parent components define status → color mappings
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
      {children || label}
    </span>
  );
}
