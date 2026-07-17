import { Card, CardContent } from '@/components/ui/card';

/** Generic streaming skeleton shown instantly when a nav item is clicked. */
export function RouteSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="skeleton-shimmer h-12 w-64 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="skeleton-shimmer mb-3 h-4 w-20 rounded" />
              <div className="skeleton-shimmer h-8 w-24 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent>
          <div className="skeleton-shimmer mb-4 h-5 w-40 rounded" />
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-10 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
