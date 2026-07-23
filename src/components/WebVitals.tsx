'use client';

import { onCLS, onINP, onLCP } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

function sendToSentry(metric: {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
}) {
  Sentry.captureMessage(`Web Vital: ${metric.name} (${metric.rating})`, 'info');
}

export default function WebVitals() {
  if (typeof window === 'undefined') return null;

  onCLS(sendToSentry);
  onINP(sendToSentry);
  onLCP(sendToSentry);

  return null;
}
