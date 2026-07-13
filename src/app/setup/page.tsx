import { AlertCircle } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-void)]">
      <div className="w-full max-w-2xl ledger-panel p-8 shadow-[var(--shadow-offset)] shadow-[var(--shadow-color)]">
        <div className="text-center mb-8 border-b ledger-border pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--alert-red)]/10 border border-[var(--alert-red)] mb-4">
            <AlertCircle size={20} className="text-[var(--alert-red)]" />
          </div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-[var(--alert-red)]">
            System Initialization Failure
          </h1>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            Critical Environment Variables Missing
          </p>
        </div>

        <div className="space-y-4 font-mono text-sm text-[var(--text-primary)]">
          <p>
            The Edge Middleware has intercepted this request because Vercel's servers are missing your Supabase credentials. 
          </p>
          <p className="text-[var(--signal-amber)]">
            Even if you added them to your Vercel Dashboard, Vercel requires you to <strong>Redeploy</strong> your application for them to take effect.
          </p>
          
          <div className="bg-[var(--bg-panel)] p-4 border ledger-border mt-6">
            <h2 className="uppercase tracking-widest font-bold mb-4 text-[10px] ledger-muted">How to Fix This:</h2>
            <ol className="list-decimal pl-4 space-y-3">
              <li>Open your Vercel Dashboard and go to your project.</li>
              <li>Navigate to <strong>Settings &gt; Environment Variables</strong>.</li>
              <li>Ensure both <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are saved and enabled for the <strong>Production</strong> environment.</li>
              <li>Go to the <strong>Deployments</strong> tab.</li>
              <li>Click the <code>...</code> on your latest deployment and select <strong>Redeploy</strong> (Do not use "Use existing Build Cache").</li>
            </ol>
          </div>
        </div>

        <div className="relative border-t ledger-border pt-6 mt-8 text-center">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] px-2 text-[10px] font-mono ledger-muted uppercase">
            Awaiting Configuration
          </span>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary px-8 py-2 mt-4"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
}
