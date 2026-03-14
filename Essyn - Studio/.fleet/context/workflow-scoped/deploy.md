# Context Layer 3 — Workflow: Deploy

> Regras ativas APENAS durante workflow de deploy.

## Pré-Deploy Obrigatório

- [ ] Todos os testes passam (unit + e2e)
- [ ] Build de produção completa sem erros
- [ ] Nenhum TODO/FIXME em código que vai para produção
- [ ] Migrations pendentes testadas em staging
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Rollback plan documentado

## Durante Deploy

- Canary agent roda build completo antes de qualquer push
- Se canary falhar: ABORT. Não force deploy.
- Monitore logs por 10 minutos após deploy

## Pós-Deploy

- Verifique health checks
- Smoke test manual das features principais
- Registre em decisions.log: versão, features incluídas, status

## Rollback

1. `git revert` do commit de deploy
2. Redeploy versão anterior
3. Registre incidente em decisions.log
4. Post-mortem como próxima task
