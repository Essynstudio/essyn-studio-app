# Rule: Security

- Todo input externo é hostil até prova contrária — valide sempre
- Queries SQL parametrizadas, nunca concatenação
- Passwords hasheados (bcrypt/argon2)
- Secrets apenas via variáveis de ambiente
- CORS restritivo em produção
- Tokens com expiração configurada
- Dados sensíveis (PII) nunca em logs
- npm audit sem vulnerabilidades críticas
