# Spec: [NOME DA FEATURE]

> Contrato formal. Builders executam contra este documento.

## Referências
- Mission Brief: `.fleet/specs/brief-[feature].md`
- Research: `.fleet/specs/research-[feature].md`
- Decisão de Arquitetura: `decisions.log` entrada #[N]

## Abordagem Escolhida
[Descrição em 3-5 frases. Referência à decisão do Architect.]

## Tasks

### Task 1: [Nome descritivo]
- **Agente:** builder-backend | builder-frontend
- **Escopo:** `src/[path]/`
- **O que fazer:** [Descrição clara]
- **Critérios de done:**
  - [ ] [Critério testável]
  - [ ] Testes adicionados
  - [ ] Lint passa

### Task 2: [Nome descritivo]
- **Agente:** builder-backend | builder-frontend
- **Escopo:** `src/[path]/`
- **Depende de:** Task 1
- **O que fazer:** [Descrição clara]
- **Critérios de done:**
  - [ ] [Critério testável]
  - [ ] Testes adicionados
  - [ ] Lint passa

## Ordem de Execução
```
Task 1 (independente) → Task 2 (depende de 1)
```

## Fora de Escopo
- [O que explicitamente NÃO faz parte desta feature]

---

**Spec criada por:** Lead
**Data:** YYYY-MM-DD
**Status:** Draft | Aprovada | Em execução | Concluída
