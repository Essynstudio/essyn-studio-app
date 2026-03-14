# Boundaries — Mapa do Projeto Essyn Studio

> O que cada pasta faz. Agentes devem respeitar estes limites.

## Raiz
| Pasta/Arquivo | Função | Quem modifica |
|---------------|--------|---------------|
| `CLAUDE.md` | Config do Claude Code | Lead |
| `.fleet/` | Sistema Fleet Protocol | Lead (estado), Todos (reviews) |
| `.claude/` | Rules e commands | Lead |
| `src/` | Código fonte da aplicação | Builders |
| `supabase/` | Backend (migrations, config) | Builder Backend |
| `public/` | Assets estáticos | Builder Frontend |
| `docs/` | Documentação | Qualquer agente |

## src/ (Código Fonte)
| Pasta | Função | Escopo |
|-------|--------|--------|
| `src/app/components/` | Componentes React reutilizáveis | Builder Frontend |
| `src/app/routes/` | Páginas e rotas | Builder Frontend |
| `src/app/hooks/` | Custom hooks React | Builder Frontend |
| `src/app/contexts/` | Context providers (estado global) | Builder Frontend |
| `src/app/types/` | TypeScript types e interfaces | Ambos builders |
| `src/app/utils/` | Funções utilitárias frontend | Builder Frontend |
| `src/app/api/` | Chamadas a APIs | Builder Backend |
| `src/app/styles/` | Estilos específicos de componentes | Builder Frontend |
| `src/app/data/` | Dados estáticos / mock | Builder Frontend |
| `src/lib/` | Libs compartilhadas (supabase client) | Builder Backend |
| `src/services/` | Lógica de negócio / serviços | Builder Backend |
| `src/styles/` | Design tokens e CSS global | Builder Frontend |
| `src/__tests__/` | Testes | Tester |
| `src/main.tsx` | Entry point — NÃO MODIFIQUE sem Lead | Ninguém |

## supabase/ (Backend)
| Pasta | Função |
|-------|--------|
| `supabase/migrations/` | SQL migrations (NUNCA edite existentes) |
| `supabase/config.toml` | Configuração do Supabase local |

## Regras de Boundary
- Builder Frontend: SÓ modifica `src/app/`, `src/styles/`, `public/`
- Builder Backend: SÓ modifica `src/lib/`, `src/services/`, `src/app/api/`, `supabase/`
- Tester: SÓ modifica `src/__tests__/`
- Ninguém modifica `node_modules/`, `dist/`, `.git/`
- Cross-boundary (frontend + backend): precisa de 2 builders ou Lead decide
