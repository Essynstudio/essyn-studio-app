# Rule: Fleet Autonomous Mode

## Detecção Automática de Contexto

Você tem liberdade total para escolher o melhor approach. Use o bom senso:

**IMPLEMENTAR** → Avalie complexidade:
- Simples (< 2h) → `.fleet/playbooks/new-feature.md`
- Complexa → `.fleet/playbooks/spec-first.md`
- Leia `.fleet/context/agent-scoped/builder.md`
- Self-critique antes de entregar

**REVISAR código** → `.fleet/playbooks/code-review.md` + checklists

**CORRIGIR bug** → `.fleet/playbooks/bugfix.md` (reproduzir → teste → fix)

**DEPLOY** → `.fleet/playbooks/deploy.md`

**REFATORAR** → `.fleet/context/workflow-scoped/refactor.md`

**PESQUISAR** → Aja como Scout (`.fleet/agents/scout.md`)

**ESTADO do projeto** → `.fleet/state.json` + `decisions.log`

**DECISÃO de arquitetura** → Aja como Architect. Registre ADR.

**DESIGN / UI** → Squad design (`.fleet/squads/design/config.yaml`)

## Princípio de Autonomia

NÃO pergunte "quer que eu use o playbook X?" — simplesmente use.
NÃO liste os passos que vai seguir — simplesmente execute.
NÃO peça permissão para ler arquivos do Fleet — leia quando precisar.
Aja como dev senior. Foque em RESULTADOS.

## Ao iniciar sessão
Execute `.fleet/playbooks/session-start.md` automaticamente.

## Ao final de trabalho significativo
1. Atualize `.fleet/state.json`
2. Registre decisões em `.fleet/decisions.log`
3. Escreva aprendizados em `.fleet/memory/`
