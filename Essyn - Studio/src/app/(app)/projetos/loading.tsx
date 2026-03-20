export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg bg-[var(--border-subtle)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--border-subtle)]" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>
    </div>
  );
}
