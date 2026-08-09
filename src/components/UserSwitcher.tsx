'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/navigation';
import { Users, ChevronDown } from 'lucide-react';
import { T } from "@/components/Translate";

export function UserSwitcher() {
  const { user, isAdmin, isHR, isCEO } = useUser();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isAdmin && !isHR && !isCEO) return null;

  const handleSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLoading(true);
    try {
      if (value === 'CLEAR') {
        await fetch('/api/auth/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clear: true }),
        });
      } else {
        await fetch('/api/auth/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ impersonateId: value }),
        });
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="relative hidden md:flex items-center">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
        <Users size={14} className={user.isImpersonated ? "text-[var(--rose)]" : "text-[var(--text-muted)]"} />
      </div>
      <select
        className={`appearance-none rounded-xl border ${user.isImpersonated ? 'border-[var(--rose)] bg-[var(--rose-soft)] text-[var(--rose)]' : 'border-[var(--border-hairline)] bg-[var(--bg-app)] text-[var(--text-muted)]'} py-1.5 pl-8 pr-8 text-xs font-semibold focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] disabled:opacity-50 transition-colors`}
        disabled={loading}
        value={user.isImpersonated ? user.id : 'CLEAR'}
        onChange={handleSwitch}
      >
        <option value="CLEAR">View as Myself</option>
        <optgroup label="Impersonate Employee">
          {/* Quick list of mock users for the switcher demo; in a real app this would be populated dynamically */}
          <option value="clx1v2m3a0000abc1defg2hij">Omar Faruk Kafi (Engineering Dir)</option>
          <option value="clx2w3n4b1111bcd2efgh3ijk">Lutfor Rahman (Finance Dir)</option>
          <option value="clx3x4o5c2222cde3fghi4jkl">Musrat Jahan Gungun (Manager)</option>
          <option value="clx5z6q7e4444efg5hijk6lmn">Rafiqul Islam (Senior Developer)</option>
          <option value="clx7b8s9g6666ghi7jklm8nop">Ayesha Siddiqua (UX Designer)</option>
        </optgroup>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <ChevronDown size={14} className={user.isImpersonated ? "text-[var(--rose)]" : "text-[var(--text-muted)]"} />
      </div>
    </div>
  );
}
