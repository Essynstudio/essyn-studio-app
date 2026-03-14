# Checklist: Performance Review

> Preencha com [x] ou [ ] (falhou + motivo).
> Salve resultado em: `.fleet/reviews/[branch]-performance.md`

## Database
- [ ] Nenhuma query N+1 (use eager loading ou batching)
- [ ] Queries complexas têm índices apropriados
- [ ] Paginação em todo endpoint que retorna lista
- [ ] Transactions são curtas
- [ ] Nenhum SELECT * — apenas campos necessários

## API & Network
- [ ] Responses grandes usam paginação ou streaming
- [ ] Cache headers configurados para conteúdo estático
- [ ] Timeouts configurados em chamadas externas
- [ ] Rate limiting em endpoints públicos

## Frontend (se aplicável)
- [ ] Imagens otimizadas (WebP, lazy loading)
- [ ] Bundle size não aumentou significativamente
- [ ] Nenhum re-render desnecessário
- [ ] Fonts com display: swap

## Código
- [ ] Nenhum loop O(n²) onde O(n) é possível
- [ ] Operações pesadas são assíncronas / background
- [ ] Nenhum memory leak óbvio

---

**Veredicto:** APPROVED | CHANGES_REQUESTED | BLOCKED
**Observações:**
