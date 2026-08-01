"use client";
import React from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';

export function T({ children }: { children: string }) {
  const { language } = useAppStore();
  const dict = translations[language] || translations['en'];
  return <>{dict[children] || children}</>;
}
