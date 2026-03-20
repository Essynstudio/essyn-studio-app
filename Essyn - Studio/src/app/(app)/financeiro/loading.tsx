export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg bg-[var(--border-subtle)]" />
        <div className="h-9 w-36 rounded-xl bg-[var(--border-subtle)]" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Table */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>
    </div>
  );
}
