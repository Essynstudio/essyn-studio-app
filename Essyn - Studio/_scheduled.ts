/**
 * Essyn Studio — Cloudflare Cron Worker
 * Deploy separado com: npx wrangler deploy --config wrangler-cron.jsonc
 *
 * Este worker chama o endpoint /api/cron/automations do app principal
 * todos os dias às 9h (horário de Brasília = 12h UTC).
 */

interface Env {
  CRON_SECRET: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default {
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(
      fetch("https://app.essyn.studio/api/cron/automations", {
        method: "POST",
        headers: {
          "x-cron-secret": env.CRON_SECRET,
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          const body = await res.text();
          console.log(`[Cron] Status ${res.status}: ${body.slice(0, 500)}`);
        })
        .catch((err) => {
          console.error("[Cron] Failed to call automations endpoint:", err);
        })
    );
  },
};
