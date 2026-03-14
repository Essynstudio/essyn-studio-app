# Playbook: Spec-First (Features Complexas)

> Use quando a feature afeta 3+ arquivos, envolve integração
> externa, muda schema, ou tem estimativa > 2 horas.

## Fase 1: Clarificação (Lead)
1. Preencha .fleet/templates/mission-brief.md
2. Liste TODAS as premissas
3. Confirme premissas antes de prosseguir

## Fase 2: Pesquisa (Scout)
1. Spawne Scout para pesquisar abordagens
2. Scout entrega: .fleet/specs/research-[feature].md

## Fase 3: Arquitetura (Architect)
1. Spawne Architect com research do Scout
2. Architect propõe 2-3 abordagens com trade-offs
3. Lead valida e registra decisão em decisions.log

## Fase 4: Spec (Lead)
1. Lead escreve spec em .fleet/specs/[feature].md
2. Spec é o contrato — builders executam contra ela

## Fase 5: Execução (Builders)
1. Lead spawna builders com referência à spec
2. Fluxo: build → self-critique → report → review → merge

## Quando NÃO usar
- Features simples (< 2h)
- Bugfixes
- Refactors puros
