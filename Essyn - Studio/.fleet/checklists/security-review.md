# Checklist: Security Review

> Preencha com [x] (passou) ou [ ] (falhou + motivo).
> Salve resultado em: `.fleet/reviews/[branch]-security.md`

## Input Validation
- [ ] Todo input de usuário é validado (tipo, formato, range)
- [ ] Inputs de string têm limite de tamanho
- [ ] File uploads validam tipo MIME e tamanho máximo
- [ ] Query parameters são sanitizados antes de uso

## Authentication & Authorization
- [ ] Endpoints protegidos exigem autenticação válida
- [ ] Permissões verificadas ANTES de executar ação
- [ ] Tokens têm expiração configurada

## Data Protection
- [ ] Passwords hasheados (bcrypt/argon2), nunca plain text
- [ ] Dados sensíveis (PII) não aparecem em logs
- [ ] Responses não vazam dados internos (stack traces, IDs)
- [ ] CORS configurado restritivamente

## Injection Prevention
- [ ] Queries SQL parametrizadas (nunca concatenação)
- [ ] HTML output escapado (prevenção XSS)
- [ ] Nenhum eval() ou new Function() com input dinâmico

## Secrets & Config
- [ ] Nenhum secret hardcoded no código
- [ ] Nenhum .env commitado
- [ ] API keys têm escopo mínimo necessário

## Dependencies
- [ ] Nenhuma dependência com vulnerabilidade conhecida (`npm audit`)

---

**Veredicto:** APPROVED | CHANGES_REQUESTED | BLOCKED
**Observações:**
