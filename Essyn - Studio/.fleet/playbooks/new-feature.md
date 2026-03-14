# Playbook: New Feature

> Fluxo padrão para features simples (< 2h de implementação).
> Para features complexas, use spec-first.md.

## Fase 1: Planning (Lead)
1. Leia .fleet/mission.md — a feature está alinhada?
2. Decomponha em tasks atômicas (max 30min cada)
3. Defina critérios de done para cada task
4. Atualize .fleet/state.json com tasks

## Fase 2: Execution (Builders)
1. Spawne builder com:
   - Descrição da task (3-5 frases)
   - Escopo de arquivos
   - Critérios de done
   - "Leia .fleet/constitution.md"
   - "Execute self-critique antes de reportar done"
2. Builder implementa → self-critique → reporta
3. Lead valida report contra critérios de done

## Fase 3: Review (Reviewers)
1. Spawne reviewers em paralelo:
   - reviewer-security com .fleet/checklists/security-review.md
   - reviewer-performance com .fleet/checklists/performance-review.md
   - reviewer-simplicity (avaliação qualitativa)
2. Lead sintetiza reviews e decide

## Fase 4: Merge (Lead)
1. Execute .fleet/checklists/pre-merge.md
2. Spawne canary para build completo
3. Se tudo passa: merge + atualize state.json
4. Registre em decisions.log
