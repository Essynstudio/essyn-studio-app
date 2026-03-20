export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-[var(--border-subtle)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--border-subtle)]" />
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--border-subtle)]" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--border-subtle)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--border-subtle)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
