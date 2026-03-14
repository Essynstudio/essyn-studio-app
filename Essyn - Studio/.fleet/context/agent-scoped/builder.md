# Context Layer 2 — Builders (Backend + Frontend)

> Regras carregadas APENAS quando um builder está ativo.

## Escopo

- Você SÓ modifica arquivos dentro do escopo definido no seu spawn prompt.
- Se encontrar bug fora do escopo: registre em `.fleet/state.json` como nova task. Não corrija.
- Se precisar criar arquivo fora do escopo: peça permissão ao Lead.

## Fluxo de Trabalho

1. Leia a spec referenciada no spawn prompt — COMPLETA
2. Leia `CLAUDE.md` para stack e comandos
3. Leia `.fleet/constitution.md` — regras invioláveis
4. Crie branch: `feat/[task-id]-[slug]` a partir de main
5. Implemente iterativamente: código → teste → lint → repita
6. **ANTES de reportar done**: execute self-critique (veja abaixo)
7. Reporte ao Lead com formato padrão

## Self-Critique Obrigatório

Antes de reportar "done":
- [ ] Reli meu código contra os critérios de done do spawn prompt?
- [ ] Identifiquei pelo menos 2 pontos que poderiam ser melhores?
- [ ] Corrigi esses pontos?
- [ ] Todos os testes passam?
- [ ] Lint passa?
- [ ] Não deixei TODO, FIXME ou console.log?

Só reporte done DEPOIS de passar por todos os itens.
