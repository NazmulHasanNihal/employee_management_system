import React from 'react';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

export function StatusBadge({ status }: { status: Status }) {
  const styles = {
    PENDING: "border-amber-500 text-amber-500",
    APPROVED: "border-green-500 text-green-500",
    REJECTED: "border-red-500 text-red-500",
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider border rounded-full bg-transparent ${styles[status] || "border-zinc-500 text-zinc-500"}`}>
      {status}
    </span>
  );
}
