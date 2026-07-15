import { PlusCircle } from "lucide-react";

export function EmptyState({ title, description, actionText, onAction }: { title: string, description: string, actionText?: string, onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg text-center w-full bg-black/20">
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {actionText && (
        <button 
          onClick={onAction}
          type="button"
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-md hover:opacity-90 transition-opacity text-xs font-mono font-bold uppercase"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}
