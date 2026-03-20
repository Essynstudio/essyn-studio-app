import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center max-w-md px-6">
        <p className="text-[64px] font-bold text-[var(--border)] mb-2">404</p>
        <h2 className="text-[20px] font-semibold text-[var(--fg)] mb-2">
          Página não encontrada
        </h2>
        <p className="text-[14px] text-[var(--fg-muted)] mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/iris"
          className="inline-flex px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
