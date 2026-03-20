export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 rounded-lg bg-[var(--border-subtle)]" />
        <div className="h-9 w-32 rounded-xl bg-[var(--border-subtle)]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>
    </div>
  );
}
