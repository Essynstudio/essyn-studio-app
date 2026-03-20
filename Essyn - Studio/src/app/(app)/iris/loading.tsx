export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-pulse">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-[var(--border-subtle)] mb-4" />

      {/* Greeting */}
      <div className="h-7 w-40 rounded-lg bg-[var(--border-subtle)] mb-2" />
      <div className="h-4 w-56 rounded bg-[var(--border-subtle)] mb-8" />

      {/* Stats row */}
      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Area cards */}
      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
        ))}
      </div>

      {/* Input bar */}
      <div className="w-full max-w-2xl h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
    </div>
  );
}
