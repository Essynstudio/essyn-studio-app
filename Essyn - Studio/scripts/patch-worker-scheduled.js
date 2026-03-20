#!/usr/bin/env node
/**
 * Post-build patch: inject a `scheduled` handler into the OpenNext worker
 * so Cloudflare Cron Triggers can call the webhook renewal API.
 *
 * Usage: node scripts/patch-worker-scheduled.js
 * Run automatically as part of: npm run deploy
 */

const fs = require("fs");
const path = require("path");

const workerPath = path.join(__dirname, "../.open-next/worker.js");

const scheduledHandler = `
  async scheduled(event, env, ctx) {
    const secret = env.CRON_SECRET;
    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio";
    if (!secret) {
      console.error("[Cron] CRON_SECRET not set — skipping webhook renewal");
      return;
    }
    const url = \`\${appUrl}/api/integrations/google-calendar/webhook?action=renew&secret=\${secret}\`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.renewed > 0) console.warn(\`[Cron] Renewed \${data.renewed} GCal webhook(s)\`);
    } catch (e) {
      console.error("[Cron] GCal webhook renewal failed:", e);
    }
  },
`;

let worker = fs.readFileSync(workerPath, "utf8");

if (worker.includes("async scheduled(")) {
  console.log("✓ Scheduled handler already patched — skipping");
  process.exit(0);
}

// Inject right after "export default {"
worker = worker.replace(
  /^export default \{$/m,
  `export default {\n${scheduledHandler}`
);

fs.writeFileSync(workerPath, worker);
console.log("✓ Injected scheduled handler into .open-next/worker.js");
