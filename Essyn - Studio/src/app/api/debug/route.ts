import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/iris/system-prompt";
import { IRIS_TOOLS } from "@/lib/iris/tools";

export async function GET() {
  const results: Record<string, unknown> = { timestamp: new Date().toISOString() };

  // Test auth flow (like iris/chat does)
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    results.auth = authError ? { error: authError.message } : { userId: user?.id?.slice(0, 8), email: user?.email };

    if (user) {
      const { data: studio } = await supabase
        .from("studios")
        .select("id, name")
        .eq("owner_id", user.id)
        .single();
      results.studio = studio ? { id: studio.id.slice(0, 8), name: studio.name } : { error: "not found" };

      // Test system prompt build
      try {
        const prompt = buildSystemPrompt(studio?.name || "Test", "visao_geral", "/iris", "");
        results.systemPrompt = { length: prompt.length, ok: true };
      } catch (e: unknown) {
        results.systemPrompt = { error: e instanceof Error ? e.message : String(e) };
      }

      // Test tools count
      results.tools = { count: IRIS_TOOLS.length };

      // Test Claude call with tools
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          system: "Responda em português, brevemente.",
          tools: IRIS_TOOLS.slice(0, 3),
          messages: [{ role: "user", content: "oi" }],
        });
        const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text || "";
        results.claudeWithTools = { ok: true, stopReason: response.stop_reason, text: text.slice(0, 100) };
      } catch (e: unknown) {
        results.claudeWithTools = { error: e instanceof Error ? e.message : String(e) };
      }
    }
  } catch (e: unknown) {
    results.fatal = { error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack?.slice(0, 300) : undefined };
  }

  return Response.json(results);
}
