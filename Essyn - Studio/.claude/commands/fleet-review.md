# /project:fleet-review

Inicie um code review multi-perspectiva seguindo o playbook em `.fleet/playbooks/code-review.md`.

1. Identifique o branch atual (ou pergunte qual branch revisar)
2. Liste os arquivos modificados com `git diff main...[branch] --name-only`
3. Execute as 3 perspectivas de review:
   - **Security:** usando `.fleet/checklists/security-review.md`
   - **Performance:** usando `.fleet/checklists/performance-review.md`
   - **Simplicity:** avaliação qualitativa de legibilidade
4. Salve resultados em `.fleet/reviews/`
5. Sintetize com veredicto final: APPROVED | CHANGES_REQUESTED | BLOCKED
