import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-2xl animate-fade-up">
        <div className="ledger-card rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rose-soft)] text-[var(--rose)]">
              <AlertCircle size={22} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              Setup incomplete
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Critical environment variables are missing
            </p>
          </div>

          <div className="space-y-4 text-sm text-[var(--text-main)]">
            <p>
              The edge middleware intercepted this request because the server is missing your Supabase credentials.
            </p>
            <p className="text-[var(--text-main)] font-medium">
              Even if you added them to your hosting dashboard, you must{' '}
              <strong>redeploy</strong> your application for them to take effect.
            </p>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                How to fix this
              </h2>
              <ol className="list-decimal space-y-2 pl-4">
                <li>Open your hosting dashboard and go to your project.</li>
                <li>Navigate to <strong>Settings &gt; Environment Variables</strong>.</li>
                <li>Ensure both <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are saved and enabled for the <strong>Production</strong> environment.</li>
                <li>Go to the <strong>Deployments</strong> tab.</li>
                <li>Click the <code>...</code> on your latest deployment and select <strong>Redeploy</strong> (do not use &ldquo;Use existing Build Cache&rdquo;).</li>
              </ol>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="btn-primary inline-block rounded-xl px-8 py-2.5 text-sm">
              Retry connection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
