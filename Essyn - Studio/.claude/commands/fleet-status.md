# /project:fleet-status

Leia os seguintes arquivos e me dê um resumo do estado atual do projeto:

1. `.fleet/mission.md` — objetivo atual
2. `.fleet/state.json` — tasks ativas, backlog, completadas
3. `.fleet/decisions.log` — últimas 5 decisões
4. `.fleet/memory/long-term.md` — contexto persistente

Formate como:
```
## Estado do Fleet
**Missão:** [resumo]
**Tasks ativas:** [lista]
**Backlog:** [contagem]
**Última decisão:** [resumo]
**Agentes idle:** [lista]
```
