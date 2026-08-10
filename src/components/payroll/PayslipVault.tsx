"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PayslipCard } from "@/components/payroll/PayslipCard";
import type { PayrollWithUser } from "@/server/queries";
import { T } from "@/components/Translate";

interface PayslipVaultProps {
  payrolls: PayrollWithUser[];
  isAdmin: boolean;
  caller: any;
}

export function PayslipVault({ payrolls, isAdmin, caller }: PayslipVaultProps) {
  const [search, setSearch] = useState("");

  const filteredPayrolls = payrolls.filter((pay) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    const nameMatch = pay.user?.name?.toLowerCase().includes(lowerSearch);
    const deptMatch = pay.user?.department?.toLowerCase().includes(lowerSearch);
    const idMatch = pay.id.toLowerCase().includes(lowerSearch);
    return nameMatch || deptMatch || idMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {/* @ts-ignore */}<T>Payslip Vault</T>
        </h2>
        
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, dept, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl"
          />
        </div>
      </div>

      {filteredPayrolls.length === 0 ? (
        <EmptyState
          title="No Payslips Found"
          description={search ? "No payslips match your search." : "There are no payslips in the vault yet."}
        />
      ) : (
        <div className="space-y-2 h-[600px] overflow-y-auto pr-2 pb-8 custom-scrollbar">
          {filteredPayrolls.map((pay) => (
            <PayslipCard key={pay.id} pay={pay} isAdmin={isAdmin} currentUser={caller} />
          ))}
        </div>
      )}
    </div>
  );
}
