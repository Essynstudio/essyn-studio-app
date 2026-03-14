# Context Layer 1 — Global

> Regras válidas para TODOS os agentes em TODAS as situações.

## Comunicação

- Reporte progresso: `Status: done|in-progress|blocked | Arquivos: [lista] | Decisões: [lista] | Dúvidas: [lista]`
- Seja explícito sobre incertezas — "não tenho certeza sobre X" é melhor que assumir errado.
- Ao encontrar ambiguidade na spec, pergunte ao Lead antes de assumir.

## Código

- TypeScript strict mode. Sem exceções.
- Todo erro deve ser tratado explicitamente — sem catch vazio.
- Funções com mais de 40 linhas provavelmente precisam ser decompostas.
- Nomes descritivos > comentários explicativos.

## Git

- Branches: `feat/[task-id]-[slug]`, `fix/[task-id]-[slug]`, `refactor/[slug]`
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
- Um commit por mudança lógica.

## Testes

- Todo código novo DEVE ter teste.
- Naming: `should [ação esperada] when [condição]`
- Cobertura mínima: happy path + 1 edge case + 1 error case.

## Performance

- Queries N+1 são proibidas. Use eager loading ou batching.
- Paginação obrigatória em qualquer endpoint que retorna lista.
