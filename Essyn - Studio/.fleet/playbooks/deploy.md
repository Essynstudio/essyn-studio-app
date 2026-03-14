# Playbook: Deploy

> Fluxo para deploy em produção.

## Pré-requisitos
- Todas as tasks do sprint estão merged
- Pre-merge checklist aprovado para cada branch
- Nenhum reviewer com status BLOCKED pendente

## Fase 1: Preparação (Lead)
1. Leia .fleet/context/workflow-scoped/deploy.md
2. Liste todas as mudanças que vão para produção
3. Verifique .env.example vs variáveis de produção
4. Documente rollback plan em .fleet/specs/

## Fase 2: Canary (Canary Agent)
1. Spawne canary para build completo
2. Canary executa: build → lint → unit tests → e2e
3. Se FAILURE: ABORT deploy, investigate
4. Se SUCCESS: prossiga

## Fase 3: Deploy
1. Push para branch de produção / trigger Vercel deploy
2. Monitore logs por 10 minutos
3. Execute smoke tests manuais
4. Verifique health checks

## Fase 4: Pós-Deploy
1. Registre em decisions.log: versão, features, status
2. Atualize .fleet/state.json: tasks → completed
3. Se problema: execute rollback plan imediatamente
