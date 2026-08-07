'use client';

import React from 'react';
import { isSalaryExempt } from '@/lib/hierarchy';
import { ShieldAlert, User, CheckCircle2 } from 'lucide-react';

export interface HierarchicalEmployeeOption {
  id: string;
  name: string;
  role?: string | null;
  department?: string | null;
  designation?: string | null;
  managerId?: string | null;
  baseSalary?: number | null;
}

interface Props {
  employees: HierarchicalEmployeeOption[];
  value: string;
  onChange: (userId: string, employee?: HierarchicalEmployeeOption) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowExemptSelection?: boolean;
}

export function HierarchicalEmployeeSelect({
  employees = [],
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an employee...',
  className = '',
  allowExemptSelection = false,
}: Props) {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const managerMap = new Map<string, string>();
  safeEmployees.forEach((e) => {
    managerMap.set(e.id, e.name);
  });

  const getManagerName = (managerId?: string | null) => {
    if (!managerId) return null;
    return managerMap.get(managerId) || 'Manager';
  };

  const isExecutive = (role?: string | null) => {
    const r = (role || '').toUpperCase();
    return r === 'CEO' || r === 'COO' || r === 'CTO' || r === 'CFO' || r.includes('CHIEF');
  };

  const isManagement = (role?: string | null) => {
    const r = (role || '').toUpperCase();
    return r.includes('DIRECTOR') || r.includes('MANAGER') || r.includes('LEAD') || r.includes('HEAD');
  };

  const executiveTier = safeEmployees.filter((e) => isExecutive(e.role));
  const managementTier = safeEmployees.filter((e) => !isExecutive(e.role) && isManagement(e.role));
  const staffTier = safeEmployees.filter((e) => !isExecutive(e.role) && !isManagement(e.role));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEmp = safeEmployees.find((emp) => emp.id === selectedId);
    onChange(selectedId, selectedEmp);
  };

  const selectedEmployee = safeEmployees.find((e) => e.id === value);
  const selectedIsExempt = selectedEmployee ? isSalaryExempt(selectedEmployee.role || '') : false;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-11 px-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <option value="" disabled className="bg-slate-900 text-slate-400">
            -- {placeholder} --
          </option>

          {executiveTier.length > 0 && (
            <optgroup label="👑 Executive Tier (Top Leadership)" className="bg-slate-900 text-amber-400 font-semibold">
              {executiveTier.map((emp) => {
                const exempt = isSalaryExempt(emp.role || '');
                const isDisabled = exempt && !allowExemptSelection;
                const mgrName = getManagerName(emp.managerId);
                return (
                  <option
                    key={emp.id}
                    value={emp.id}
                    disabled={isDisabled}
                    className={isDisabled ? 'text-slate-500 bg-slate-950 font-normal italic' : 'text-slate-100 bg-slate-900 font-medium'}
                  >
                    {emp.name} — {emp.role || 'Executive'}{' '}
                    {exempt ? '🔒 (CEO - Salary Exempt)' : mgrName ? `(Reports to: ${mgrName})` : ''}
                  </option>
                );
              })}
            </optgroup>
          )}

          {managementTier.length > 0 && (
            <optgroup label="🎯 Management & Directors" className="bg-slate-900 text-indigo-400 font-semibold">
              {managementTier.map((emp) => {
                const mgrName = getManagerName(emp.managerId);
                return (
                  <option key={emp.id} value={emp.id} className="text-slate-100 bg-slate-900">
                    {emp.name} — {emp.role || emp.designation || 'Manager'}{' '}
                    {mgrName ? `(Reports to: ${mgrName})` : ''}
                  </option>
                );
              })}
            </optgroup>
          )}

          {staffTier.length > 0 && (
            <optgroup label="👥 Staff & Operations" className="bg-slate-900 text-emerald-400 font-semibold">
              {staffTier.map((emp) => {
                const mgrName = getManagerName(emp.managerId);
                return (
                  <option key={emp.id} value={emp.id} className="text-slate-100 bg-slate-900">
                    {emp.name} — {emp.role || emp.department || 'Staff'}{' '}
                    {mgrName ? `(Reports to: ${mgrName})` : ''}
                  </option>
                );
              })}
            </optgroup>
          )}
        </select>
      </div>

      {selectedEmployee && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 text-xs">
          {selectedIsExempt ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium">
                CEO Role Exempt: The CEO sets compensation for direct reports and does not receive subordinate salary edits.
              </span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-300">
                <strong className="text-slate-100">{selectedEmployee.name}</strong> ({selectedEmployee.role || 'Employee'})
                {selectedEmployee.managerId ? (
                  <span className="text-slate-400"> • Reports to: <strong className="text-slate-200">{getManagerName(selectedEmployee.managerId)}</strong></span>
                ) : (
                  <span className="text-amber-400"> • Top Direct Report</span>
                )}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
