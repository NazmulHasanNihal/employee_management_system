"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SKIP_LINKS = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#primary-navigation', label: 'Skip to navigation' },
  { href: '#search-button', label: 'Skip to search' },
];

export function SkipLinks() {
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.skip-link:focus').forEach((el) => {
          (el as HTMLElement).blur();
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pathname]);

  return (
    <div className="skip-links sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999]">
      {SKIP_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link block rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
