# Playbook: Code Review

> Fluxo para review multi-perspectiva.

## Quando usar
- Antes de qualquer merge em main
- Após builder reportar "done"
- Após bugfix em área crítica

## Fase 1: Setup (Lead)
1. Identifique o branch a ser revisado
2. Determine quais perspectivas são necessárias:
   - Security: sempre (mudanças em auth, input, API)
   - Performance: sempre (mudanças em queries, loops, rendering)
   - Simplicity: sempre (qualquer código novo)

## Fase 2: Review Paralelo
Spawne os 3 reviewers simultaneamente:

### Reviewer Security
- "Revise branch [X]. Use .fleet/checklists/security-review.md"
- "Salve resultado em .fleet/reviews/[branch]-security.md"

### Reviewer Performance
- "Revise branch [X]. Use .fleet/checklists/performance-review.md"
- "Salve resultado em .fleet/reviews/[branch]-performance.md"

### Reviewer Simplicity
- "Revise branch [X]. Avalie legibilidade e simplicidade"
- "Salve resultado em .fleet/reviews/[branch]-simplicity.md"

## Fase 3: Síntese (Lead)
1. Leia os 3 reviews
2. Se todos APPROVED: prossiga para pre-merge
3. Se CHANGES_REQUESTED: envie feedback ao builder com ações específicas
4. Se BLOCKED: investigue o problema crítico antes de qualquer ação
5. Registre decisão em decisions.log
