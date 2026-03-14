# Essyn Studio

## O que é
Plataforma SaaS para fotógrafos. Unifica workflow, galeria, WhatsApp e ferramentas diárias.
"A plataforma que pensa como fotógrafo". Estética premium e minimalista.

## Stack
- Frontend: React + Tailwind + Vite
- Backend: Supabase (Auth, DB, Storage, Edge Functions)
- Deploy: Vercel | Design: Figma

## Comandos
- `npm run dev` — dev server
- `npm run build` — build de produção
- `npm run lint` — lint + typecheck

## Regras Invioláveis
1. NUNCA commitar sem lint passar
2. NUNCA modificar migrations existentes
3. NUNCA hardcodar secrets
4. NUNCA apagar testes sem justificativa
5. TypeScript strict, sem any, sem ts-ignore

## Fleet Protocol v2
Ao iniciar: execute .fleet/playbooks/session-start.md

@.fleet/constitution.md
@.fleet/context/global.md
@.fleet/mission.md
@.fleet/boundaries.md
@.claude/rules/code-quality.md
@.claude/rules/security.md
@.claude/rules/fleet-protocol.md
@.claude/rules/fleet-autonomous.md
