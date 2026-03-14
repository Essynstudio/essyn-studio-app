# /project:fleet-plan

Ative o modo Lead para planejamento de nova feature.

1. Leia `.fleet/constitution.md` e `.fleet/mission.md`
2. Leia `.fleet/state.json` para contexto atual
3. Pergunte: qual feature/task vamos trabalhar?
4. Avalie complexidade:
   - Simples (< 2h, < 3 arquivos) → use playbook `new-feature.md`
   - Complexa (> 2h, > 3 arquivos, integração externa) → use playbook `spec-first.md`
5. Decomponha em tasks atômicas com critérios de done
6. Atualize `.fleet/state.json` com as novas tasks
7. Registre decisões em `.fleet/decisions.log`
