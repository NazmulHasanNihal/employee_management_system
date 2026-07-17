"use client";

import React from 'react';
import { ShieldCheck, Lock, FileText, Globe, Server, UserCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type SectionIcon = React.ComponentType<{ size?: number; className?: string }>;

export default function CompanyPolicyPage() {
  const { language } = useAppStore();
  const t = useTranslation(language);

  const sections: { icon: SectionIcon; title: string; color: string; items: [string, string][] }[] = [
    {
      icon: Lock,
      title: t('Data Privacy & Security'),
      color: 'text-[var(--brand-strong)]',
      items: [
        ['1.1 Confidentiality', 'All employees must maintain strict confidentiality regarding client data, internal finances, and proprietary algorithms.'],
        ['1.2 Data Handling', 'Personal identifiable information (PII) must only be processed on authorized company networks and encrypted storage systems.'],
        ['1.3 Breach Reporting', 'Any suspected data breach or phishing attempt must be reported to the IT Security team within 15 minutes of discovery.'],
      ],
    },
    {
      icon: UserCheck,
      title: t('Code of Conduct'),
      color: 'text-[var(--emerald)]',
      items: [
        ['2.1 Professionalism', 'Employees must foster a collaborative, inclusive, and respectful environment free from discrimination and harassment.'],
        ['2.2 Conflict of Interest', 'Employees must not engage in external employment or advisory roles that conflict with company interests without prior HR approval.'],
        ['2.3 Communications', 'Internal communications via Slack, email, or video conferencing must remain professional and adhere to compliance retention laws.'],
      ],
    },
    {
      icon: Server,
      title: t('IT Assets & Hardware'),
      color: 'text-[var(--sky)]',
      items: [
        ['3.1 Asset Ownership', 'All laptops, monitors, and mobile devices provided by the company remain company property and must be returned upon offboarding.'],
        ['3.2 Acceptable Use', 'Company devices should not be used for unauthorized software installation, cryptocurrency mining, or accessing explicit content.'],
        ['3.3 VPN & Access', 'Remote access to staging or production environments requires the use of the company VPN and physical hardware authentication keys.'],
      ],
    },
    {
      icon: Globe,
      title: t('Attendance & Leave'),
      color: 'text-[var(--amber)]',
      items: [
        ['4.1 Working Hours', 'Standard core hours are 10:00 AM to 3:00 PM local time. Flexible hours are permitted outside this window.'],
        ['4.2 PTO Requests', 'Planned Paid Time Off (PTO) must be submitted at least 2 weeks in advance via the Leave module for manager approval.'],
        ['4.3 Sick Leave', 'In the event of sudden illness, employees must notify their manager and log the sick leave within 24 hours.'],
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={t('Corporate Policies')}
        subtitle={t('Standard operating procedures, compliance guidelines, and code of conduct.')}
        icon={<ShieldCheck size={20} />}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${s.color}`}>
                  <Icon size={18} /> {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {s.items.map(([head, body]) => (
                  <p key={head}>
                    <strong className="text-[var(--text-main)]">{head}:</strong> {body}
                  </p>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="flex items-start gap-4">
        <FileText className="mt-1 shrink-0 text-[var(--text-muted)]" size={22} />
        <div>
          <h4 className="mb-1 font-semibold text-[var(--text-main)]">{t('Policy Acknowledgment')}</h4>
          <p className="text-sm text-[var(--text-muted)]">
            {t('By accessing this platform, you acknowledge that you have read, understood, and agree to abide by all Corporate Policies. Violations may result in disciplinary action up to and including termination.')}
          </p>
        </div>
      </Card>
    </div>
  );
}
