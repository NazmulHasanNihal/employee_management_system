import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";

export default function SetupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-2xl animate-fade-up">
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rose-soft)] text-[var(--rose)]">
              <AlertCircle size={22} />
            </div>
             <h1 className="text-fluid-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {/* @ts-ignore */}<T>Setup incomplete</T></h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {/* @ts-ignore */}<T>Critical environment variables are missing</T></p>
          </div>

          <div className="space-y-4 text-sm text-[var(--text-main)]">
            <p>
              {/* @ts-ignore */}<T>The edge middleware intercepted this request because the server is missing your Supabase credentials.</T></p>
            <p className="text-[var(--text-main)] font-medium">
              {/* @ts-ignore */}<T>Even if you added them to your hosting dashboard, you must</T>{' '}
              <strong>{/* @ts-ignore */}<T>redeploy</T></strong> {/* @ts-ignore */}<T>your application for them to take effect.</T></p>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>How to fix this</T></h2>
              <ol className="list-decimal space-y-2 pl-4">
                <li>{/* @ts-ignore */}<T>Open your hosting dashboard and go to your project.</T></li>
                <li>{/* @ts-ignore */}<T>Navigate to</T><strong>{/* @ts-ignore */}<T>Settings &gt; Environment Variables</T></strong>.</li>
                <li>{/* @ts-ignore */}<T>Ensure both</T><code>{/* @ts-ignore */}<T>NEXT_PUBLIC_SUPABASE_URL</T></code> {/* @ts-ignore */}<T>and</T><code>{/* @ts-ignore */}<T>NEXT_PUBLIC_SUPABASE_ANON_KEY</T></code> {/* @ts-ignore */}<T>are saved and enabled for the</T><strong>{/* @ts-ignore */}<T>Production</T></strong> {/* @ts-ignore */}<T>environment.</T></li>
                <li>{/* @ts-ignore */}<T>Go to the</T><strong>{/* @ts-ignore */}<T>Deployments</T></strong> {/* @ts-ignore */}<T>tab.</T></li>
                <li>{/* @ts-ignore */}<T>Click the</T><code>...</code> {/* @ts-ignore */}<T>on your latest deployment and select</T><strong>{/* @ts-ignore */}<T>Redeploy</T></strong> {/* @ts-ignore */}<T>(do not use &ldquo;Use existing Build Cache&rdquo;).</T></li>
              </ol>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="btn-primary inline-block rounded-xl px-8 py-2.5 text-sm">
              {/* @ts-ignore */}<T>Retry connection</T></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
