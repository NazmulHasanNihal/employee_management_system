import React from 'react';
import { getMyReviews } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ReviewsClient from './ReviewsClientDynamic';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const caller = await getCaller();
  const { reviews, scores } = await getMyReviews(caller);
  const canReview = caller?.isAdmin || caller?.isCEO;
  const employees = canReview
    ? await prisma.user.findMany({
        where: { id: { not: caller!.id }, status: { not: 'Terminated' } },
        select: { id: true, name: true, designation: true as const },
        orderBy: { name: 'asc' },
        take: 200,
      })
    : [];
  return (
    <ReviewsClient
      scores={scores}
      reviews={reviews}
      canReview={!!canReview}
      employees={employees}
    />
  );
}
