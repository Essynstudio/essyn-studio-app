# Context Layer 3 — Workflow: Refactor

> Regras ativas APENAS durante workflow de refactoring.

## Princípio

Refactor não muda comportamento. Se o output muda, não é refactor.

## Regras

- Todos os testes existentes DEVEM continuar passando sem modificação.
- Se um teste precisa mudar, o refactor está mudando comportamento.
- Commits atômicos: cada commit mantém testes verdes.
- Prefira refactors menores e frequentes sobre grandes e arriscados.

## Fluxo

1. Identifique o code smell ou problema estrutural
2. Escreva testes adicionais que cobrem comportamento atual (se faltam)
3. Refatore em passos pequenos, rodando testes a cada passo
4. Lint + typecheck a cada commit

## Proibido Durante Refactor

- Adicionar features novas
- Corrigir bugs (registre como task separada)
- Mudar APIs públicas (é breaking change)
- "Aproveitar" para melhorar outra coisa fora do escopo
