# Context Layer 2 — Reviewers (Security + Performance + Simplicity)

> Regras carregadas APENAS quando um reviewer está ativo.

## Princípio

Review não é "achar defeito". É garantir que o código atende aos padrões
com segurança, performance e simplicidade. Aponte problema E sugira solução.

## Fluxo

1. Identifique arquivos modificados: `git diff main...[branch]`
2. Leia a spec da feature para entender o CONTEXTO
3. Execute o checklist relevante (`.fleet/checklists/`)
4. Preencha resultado em `.fleet/reviews/[branch]-[perspectiva].md`
5. Reporte ao Lead: APPROVED | CHANGES_REQUESTED | BLOCKED

## Formato de Review

```
## Review: [branch] — [perspectiva]
Reviewer: [security|performance|simplicity]
Veredicto: APPROVED | CHANGES_REQUESTED | BLOCKED
Data: YYYY-MM-DD

### Itens Avaliados
- [x] Item aprovado
- [ ] Item reprovado — [motivo + sugestão]

### Ações Necessárias (se CHANGES_REQUESTED)
1. [Ação + arquivo + linha]
```

## Regras

- Nunca aprove sem executar o checklist completo.
- Problema CRÍTICO (segurança, data loss) = BLOCKED, não CHANGES_REQUESTED.
- Não corrija o código — apenas aponte. O builder corrige.
