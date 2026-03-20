import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";
import { IRIS_TOOLS, executeTool } from "@/lib/iris/tools";
import { buildSystemPrompt } from "@/lib/iris/system-prompt";
import { computeAlerts, filterAlerts, formatAlertsForPrompt } from "@/lib/iris/alerts";
import { computeRelationshipInsights, formatRelationshipInsights } from "@/lib/iris/relationships";
import { detectWorkload, formatWorkloadForPrompt } from "@/lib/iris/workload";
import { computeSeasonalInsights, formatSeasonalForPrompt } from "@/lib/iris/seasonal";
import { detectContext } from "@/lib/iris/contexts";
import type { IrisContextKey } from "@/lib/iris/contexts";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("[Iris] ANTHROPIC_API_KEY not set");
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

/* ── Rate limiter: 12 requests per minute per studio ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(studioId: string): boolean {
  const now = Date.now();

  // Clean up stale entries (older than 2 windows) to prevent memory leak
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt + RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(studioId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(studioId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

/* ── Detect action intent from user message ── */
const ACTION_REGEX =
  /\b(cri[ae]|cadastr[ae]|registr[ae]|atualiz[ae]|delet[ae]|cancel[ae]|marc[ae]|envi[ae]|avanc[ae]|duplic[ae]|restaur[ae]|export[ae]|alter[ae]|faz(?:er)?|adiciona|coloc[ae]|inclui|remov[ae]|apag[ae]|salv[ae])\b/;

function isActionIntent(text: string): boolean {
  return ACTION_REGEX.test(text.toLowerCase());
}

interface ChatMessage {
  role: "user" | "assistant";
  // content can be a plain string or multimodal array (text + image blocks)
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: IrisContextKey;
  pathname?: string;
}

/* ── SSE helpers ── */
const encoder = new TextEncoder();

function sseChunk(data: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  // ── Auth (early return as JSON before opening SSE stream) ──
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!studio) {
    return Response.json({ error: "Estúdio não encontrado" }, { status: 404 });
  }

  if (!checkRateLimit(studio.id)) {
    return Response.json(
      { error: "Muitas mensagens. Aguarde um momento antes de tentar novamente." },
      { status: 429 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { messages, context, pathname = "/iris" } = body;

  if (!messages || messages.length === 0) {
    return Response.json({ error: "Mensagens vazias" }, { status: 400 });
  }

  // ── Open SSE stream — everything below runs inside the stream ──
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(sseChunk(data));
        } catch {
          // Controller already closed
        }
      };

      // Heartbeat to prevent connection timeout on long operations (every 25s)
      let heartbeatInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
        try {
          controller.enqueue(sseChunk({ heartbeat: true }));
        } catch {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
        }
      }, 25000);

      try {
        // ── Context & Data ──
        const contextKey = context || detectContext(pathname);

        const [allAlerts, relationshipInsights, workloadInsight, seasonalInsights, memoriesResult] =
          await Promise.all([
            computeAlerts(supabase, studio.id),
            computeRelationshipInsights(supabase, studio.id),
            detectWorkload(supabase, studio.id),
            computeSeasonalInsights(supabase, studio.id),
            supabase
              .from("iris_memories")
              .select("category, key, value")
              .eq("studio_id", studio.id)
              .order("updated_at", { ascending: false })
              .limit(50),
          ]);

        // Format memories for system prompt injection
        const memories = memoriesResult.data || [];
        let memoriesText = "";
        if (memories.length > 0) {
          const grouped: Record<string, string[]> = {};
          for (const m of memories) {
            if (!grouped[m.category]) grouped[m.category] = [];
            grouped[m.category].push(`${m.key}: ${m.value}`);
          }
          memoriesText = Object.entries(grouped)
            .map(([cat, items]) => `[${cat}]\n${items.join("\n")}`)
            .join("\n\n");
        }

        const contextAlerts = filterAlerts(allAlerts, contextKey);
        const alertsText = formatAlertsForPrompt(contextAlerts);
        const insightsPrompt = formatRelationshipInsights(relationshipInsights);
        const workloadPrompt = formatWorkloadForPrompt(workloadInsight);
        const seasonalPrompt = formatSeasonalForPrompt(seasonalInsights);
        const systemPromptText =
          buildSystemPrompt(studio.name, contextKey, pathname, alertsText, memoriesText) +
          insightsPrompt +
          workloadPrompt +
          seasonalPrompt;

        // System prompt with caching — saves ~90% on input tokens
        const systemPrompt: Anthropic.TextBlockParam[] = [
          {
            type: "text",
            text: systemPromptText,
            cache_control: { type: "ephemeral" },
          },
        ];

        // Build Claude messages — handle both string and multimodal content
        const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : m.content as unknown as Anthropic.ContentBlockParam[],
        }));

        const lastUserMsg = messages[messages.length - 1];
        const lastUserText = typeof lastUserMsg?.content === "string"
          ? lastUserMsg.content
          : Array.isArray(lastUserMsg?.content)
            ? (lastUserMsg.content as Array<{ type: string; text?: string }>).find(b => b.type === "text")?.text || ""
            : "";

        const isAction = isActionIntent(lastUserText);

        // Detect analytical intent — uses extended thinking for deeper reasoning
        const ANALYSIS_REGEX =
          /\b(analisa|analise|análise|resume.*geral|estratégi|planej|previsão|tendência|como está|como melhor|diagnóstico|avalia|avalie|por que|qual a causa|conselho|sugestão|perspectiva|insights?|desempenho|métricas?|crescimento|comparar|relatório)\b/i;
        const isAnalysis = ANALYSIS_REGEX.test(lastUserText) && !isAction;

        // ── Streaming tool loop ──
        // Uses stream() for every API call — text deltas are forwarded immediately
        // Analysis queries use extended thinking (budget: 3000 tokens) for deeper reasoning
        // Tool execution sends a status event so the client can show feedback

        let toolWasCalled = false;
        let continueLoop = true;
        let isFirstCall = true;
        let toolIterations = 0;
        const MAX_TOOL_ITERATIONS = 8;
        let currentToolChoice: Anthropic.ToolChoice = isAction
          ? { type: "any", disable_parallel_tool_use: true }
          : { type: "auto" };
        let streamedText = "";

        while (continueLoop && toolIterations < MAX_TOOL_ITERATIONS) {
          // Extended thinking on first call for analytical queries
          const useThinking = isAnalysis && isFirstCall;
          isFirstCall = false;

          const streamParams = useThinking
            ? {
                // Analytical queries: Sonnet 4.6 with full thinking budget
                model: "claude-sonnet-4-6" as const,
                max_tokens: 16000,
                thinking: { type: "enabled" as const, budget_tokens: 12000 },
                temperature: 1 as const,
                system: systemPrompt,
                tools: IRIS_TOOLS,
                messages: claudeMessages,
                tool_choice: currentToolChoice,
                metadata: { user_id: studio.id },
              }
            : {
                // Operational queries: Haiku 4.5 for speed and cost
                model: "claude-haiku-4-5-20251001" as const,
                max_tokens: 2048,
                temperature: isAction ? 0.2 : 0.7,
                system: systemPrompt,
                tools: IRIS_TOOLS,
                messages: claudeMessages,
                tool_choice: currentToolChoice,
                metadata: { user_id: studio.id },
              };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiStream = anthropic.messages.stream(streamParams as any);

          // Forward text deltas as they arrive
          let chunkText = "";
          for await (const event of apiStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              chunkText += event.delta.text;
              streamedText += event.delta.text;
              send({ t: event.delta.text });
            }
          }

          const response = await apiStream.finalMessage();

          if (response.stop_reason === "tool_use") {
            // Execute tools — signal client to show "buscando dados" indicator
            send({ status: "tool_running" });
            toolIterations++;
            toolWasCalled = true;
            streamedText = ""; // Reset — tool response will be the real reply

            const toolBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
            );

            // Add assistant message with tool_use blocks
            claudeMessages.push({ role: "assistant", content: response.content });

            // Execute each tool sequentially
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tool of toolBlocks) {
              console.debug(`[Iris] Tool: ${tool.name}`, JSON.stringify(tool.input).slice(0, 200));

              let result: string;
              let isError = false;

              try {
                result = await executeTool(
                  tool.name,
                  tool.input as Record<string, unknown>,
                  supabase,
                  studio.id
                );

                try {
                  const parsed = JSON.parse(result);
                  if (parsed.erro || parsed.error) isError = true;
                } catch {
                  // Not JSON — text result, fine
                }
              } catch (toolError: unknown) {
                isError = true;
                const msg = toolError instanceof Error ? toolError.message : "Erro desconhecido";
                result = JSON.stringify({ erro: msg });
                console.error(`[Iris] Tool ${tool.name} threw:`, msg);
              }

              console.debug(`[Iris] ${tool.name} → ${isError ? "ERROR" : "OK"}:`, result.slice(0, 200));

              toolResults.push({
                type: "tool_result",
                tool_use_id: tool.id,
                content: result,
                ...(isError ? { is_error: true } : {}),
              });
            }

            // Add tool results to conversation
            claudeMessages.push({ role: "user", content: toolResults });

            // Continue loop with auto tool_choice (let model decide)
            currentToolChoice = { type: "auto" };
          } else {
            // stop_reason is "end_turn" — we're done
            continueLoop = false;

            // ── Safety check: action claimed without tool execution ──
            if (isAction && !toolWasCalled) {
              const claimsSuccess =
                /\b(criado|cadastrado|registrado|atualizado|pronto|sucesso|feito|deletado|cancelado|enviado|avançad|duplicad|restaurad|exportad|adicionado|removido|salvo)\b/i.test(
                  streamedText
                );
              if (claimsSuccess) {
                // Override already-streamed text with safe fallback
                send({
                  override:
                    "Desculpe, não consegui executar essa ação agora. Por favor, tente pelo formulário na página correspondente, ou reformule seu pedido com mais detalhes (nome, dados, etc).",
                });
              }
            }
          }
        }

        if (toolIterations >= MAX_TOOL_ITERATIONS) {
          send({ status: "tool_limit_reached" });
        }

        send({ done: true });
      } catch (error) {
        console.error("[Iris API Error]", error);

        if (error instanceof Anthropic.APIError) {
          if (error.status === 401) {
            send({ error: "API key da Anthropic inválida ou ausente" });
          } else if (error.status === 429) {
            send({ error: "Muitas requisições. Tente novamente em alguns segundos." });
          } else {
            send({ error: `Erro da API: ${error.message}` });
          }
        } else {
          const errMsg = error instanceof Error ? error.message : String(error);
          console.error("[Iris] Full error:", errMsg);
          send({ error: "Erro interno. Tente novamente." });
        }
      } finally {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
