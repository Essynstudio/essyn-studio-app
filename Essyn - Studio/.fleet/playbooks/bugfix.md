# Playbook: Bugfix

> Fluxo para correção de bugs.

## Classificação
- **Crítico:** Produção quebrada, dados corrompidos, segurança → Fix imediato
- **Standard:** Bug funcional sem impacto crítico → Próximo sprint

## Fase 1: Diagnóstico (Lead)
1. Reproduza o bug — se não reproduz, não é bug confirmado
2. Identifique root cause (não só o sintoma)
3. Avalie impacto: quais features/usuários são afetados?
4. Registre em .fleet/state.json como task tipo "bugfix"

## Fase 2: Fix (Builder)
1. Spawne builder com:
   - Descrição do bug e como reproduzir
   - Root cause identificado
   - Escopo de arquivos afetados
   - "Escreva teste que FALHA com o bug, depois corrija"
2. Builder implementa: teste que falha → fix → teste passa
3. Self-critique + report

## Fase 3: Validação
1. Reviewer verifica que o fix não introduz regressão
2. Canary roda build completo
3. Para bugs críticos: deploy imediato após merge
4. Para standard: merge normal no próximo ciclo
