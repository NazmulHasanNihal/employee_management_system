import { Megaphone } from 'lucide-react';
import { getCaller } from '@/lib/auth';
import { getNews, getDepartments } from '@/server/queries';
import { PageHeader } from '@/components/PageHeader';
import AnnouncementsFeed from '@/components/announcements/AnnouncementsFeed';

export default async function AnnouncementsPage() {
  const caller = await getCaller();
  const [news, departments] = await Promise.all([getNews(caller), getDepartments()]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Company News"
        subtitle="Company-wide broadcasts, team updates, and critical alerts."
        icon={<Megaphone className="h-5 w-5" />}
      />
      <AnnouncementsFeed news={news as any} departments={departments as any} />
    </div>
  );
}
