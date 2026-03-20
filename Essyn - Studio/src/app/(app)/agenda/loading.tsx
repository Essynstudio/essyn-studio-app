export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-[var(--border-subtle)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--border-subtle)]" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-6 w-32 rounded bg-[var(--border-subtle)]" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--border-subtle)]" />
            <div className="h-8 w-8 rounded-lg bg-[var(--border-subtle)]" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[var(--border-subtle)] opacity-40" />
          ))}
        </div>
      </div>
    </div>
  );
}
