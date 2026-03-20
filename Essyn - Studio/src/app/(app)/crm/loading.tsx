export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-16 rounded-lg bg-[var(--border-subtle)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--border-subtle)]" />
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-20 rounded bg-[var(--border-subtle)]" />
            <div className="h-28 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
            <div className="h-28 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
