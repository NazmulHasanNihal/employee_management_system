import React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

export type StatusType = "success" | "error" | "pending" | "warning" | "info"

interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label: string
}

export function StatusPill({ status, label, className, ...props }: StatusPillProps) {
  const styles = {
    success: "bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30",
    error: "bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]/30",
    pending: "bg-white/10 text-white border-white/30",
    warning: "bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30",
    info: "bg-[var(--ledger-blue)]/10 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/30"
  }
  
  const icons = {
    success: <CheckCircle2 size={12} />,
    error: <XCircle size={12} />,
    pending: <Clock size={12} />,
    warning: <AlertCircle size={12} />,
    info: <AlertCircle size={12} />
  }

  return (
    <div 
      className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border", styles[status], className)}
      {...props}
    >
      {icons[status]}
      {label}
    </div>
  )
}
