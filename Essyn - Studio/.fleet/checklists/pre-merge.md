# Checklist: Pre-Merge

> O Lead executa ANTES de aprovar merge. TODOS devem passar.

## Build & Tests
- [ ] `npm run build` completa sem erros
- [ ] `npm run lint` passa sem warnings
- [ ] `npm test` — todos passam
- [ ] Canary agent reportou SUCCESS

## Reviews
- [ ] Pelo menos 1 reviewer aprovou
- [ ] Nenhum reviewer marcou BLOCKED
- [ ] Itens de CHANGES_REQUESTED endereçados

## Qualidade
- [ ] Builder executou self-critique
- [ ] Código novo tem testes
- [ ] Nenhum TODO/FIXME sem issue vinculada
- [ ] Nenhum console.log / debug statement

## Constitution
- [ ] Nenhuma regra da constitution.md violada
- [ ] Secrets não hardcoded
- [ ] Migrations existentes não alteradas
- [ ] Branch segue naming convention

## Documentação
- [ ] Se API mudou: docs atualizados
- [ ] Se config mudou: .env.example atualizado
- [ ] Decisões registradas em decisions.log

---

**Aprovado para merge:** SIM | NÃO
**Lead:** | **Data:**
