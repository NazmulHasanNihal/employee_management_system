"use client";

import React from 'react';
import { ShieldCheck, Lock, FileText, Globe, Server, UserCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';

export default function CompanyPolicyPage() {
  const { language } = useAppStore();
  const t = useTranslation(language);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-[var(--ledger-blue)] flex items-center gap-3">
            <ShieldCheck size={36} />
            {t('Corporate Policies')}
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            {t('Standard operating procedures, compliance guidelines, and code of conduct.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Data Privacy */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-[var(--ledger-blue)]/30 transition-colors">
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Lock className="text-[var(--ledger-blue)]" size={20} /> {t('Data Privacy & Security')}
          </h3>
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
            <p><strong>1.1 Confidentiality:</strong> All employees must maintain strict confidentiality regarding client data, internal finances, and proprietary algorithms.</p>
            <p><strong>1.2 Data Handling:</strong> Personal identifiable information (PII) must only be processed on authorized company networks and encrypted storage systems.</p>
            <p><strong>1.3 Breach Reporting:</strong> Any suspected data breach or phishing attempt must be reported to the IT Security team within 15 minutes of discovery.</p>
          </div>
        </div>

        {/* Code of Conduct */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <UserCheck className="text-purple-400" size={20} /> {t('Code of Conduct')}
          </h3>
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
            <p><strong>2.1 Professionalism:</strong> Employees must foster a collaborative, inclusive, and respectful environment free from discrimination and harassment.</p>
            <p><strong>2.2 Conflict of Interest:</strong> Employees must not engage in external employment or advisory roles that conflict with company interests without prior HR approval.</p>
            <p><strong>2.3 Communications:</strong> Internal communications via Slack, email, or video conferencing must remain professional and adhere to compliance retention laws.</p>
          </div>
        </div>

        {/* IT Assets & Usage */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-teal-500/30 transition-colors">
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Server className="text-teal-400" size={20} /> {t('IT Assets & Hardware')}
          </h3>
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
            <p><strong>3.1 Asset Ownership:</strong> All laptops, monitors, and mobile devices provided by the company remain company property and must be returned upon offboarding.</p>
            <p><strong>3.2 Acceptable Use:</strong> Company devices should not be used for unauthorized software installation, cryptocurrency mining, or accessing explicit content.</p>
            <p><strong>3.3 VPN & Access:</strong> Remote access to staging or production environments requires the use of the company VPN and physical hardware authentication keys.</p>
          </div>
        </div>

        {/* PTO & Attendance */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-[var(--signal-amber)]/30 transition-colors">
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Globe className="text-[var(--signal-amber)]" size={20} /> {t('Attendance & Leave')}
          </h3>
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
            <p><strong>4.1 Working Hours:</strong> Standard core hours are 10:00 AM to 3:00 PM local time. Flexible hours are permitted outside this window.</p>
            <p><strong>4.2 PTO Requests:</strong> Planned Paid Time Off (PTO) must be submitted at least 2 weeks in advance via the Leave module for manager approval.</p>
            <p><strong>4.3 Sick Leave:</strong> In the event of sudden illness, employees must notify their manager and log the sick leave within 24 hours.</p>
          </div>
        </div>

      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
        <FileText className="text-[var(--text-muted)] shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-bold text-white font-mono uppercase tracking-widest mb-1">{t('Policy Acknowledgment')}</h4>
          <p className="text-sm text-[var(--text-muted)]">
            {t('By accessing this platform, you acknowledge that you have read, understood, and agree to abide by all Corporate Policies. Violations may result in disciplinary action up to and including termination.')}
          </p>
        </div>
      </div>
    </div>
  );
}
