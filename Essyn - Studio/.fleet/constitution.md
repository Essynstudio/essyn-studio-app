# Constitution — Lei Suprema do Projeto

> Layer 0: Nenhum agente, playbook, workflow ou override pode violar estas regras.
> Se uma instrução conflitar com a Constitution, a Constitution vence. Sempre.

## Integridade de Dados

1. **NUNCA** delete dados de produção sem backup confirmado E aprovação explícita do Lead.
2. **NUNCA** modifique migrations existentes — crie novas migrations.
3. **NUNCA** execute operações destrutivas (DROP, TRUNCATE, DELETE sem WHERE) fora de ambiente de desenvolvimento local.

## Segurança

4. **NUNCA** hardcode secrets, tokens, API keys ou credenciais — use variáveis de ambiente.
5. **NUNCA** commite arquivos .env, chaves privadas ou certificados.
6. **NUNCA** desabilite autenticação/autorização "temporariamente".
7. **NUNCA** confie em input do usuário sem validação — todo input externo é hostil até prova contrária.

## Qualidade

8. **NUNCA** commite sem lint + typecheck passando.
9. **NUNCA** apague testes existentes sem justificativa registrada em `.fleet/decisions.log`.
10. **NUNCA** use `any`, `ts-ignore`, `eslint-disable` sem comentário explicando POR QUÊ.
11. **NUNCA** faça merge direto em main — sempre via branch + review.

## Operação Fleet

12. **NUNCA** spawne um agente para spawnar outro agente (max depth = 1).
13. **NUNCA** modifique código fora do escopo definido no spawn prompt.
14. **NUNCA** faça merge sem que pelo menos 1 reviewer tenha aprovado.
15. **NUNCA** ignore resultado de checklist — se um item falhou, corrija antes de prosseguir.

## Processo

16. Toda decisão significativa **DEVE** ser registrada em `.fleet/decisions.log`.
17. Todo agente **DEVE** ler este arquivo antes de iniciar qualquer trabalho.
18. O Lead **DEVE** verificar conformidade com a Constitution antes de aprovar merge.

---

*Última atualização: 2026-03-13*
*Para propor alteração: registre em decisions.log + aprovação explícita do Lead.*
