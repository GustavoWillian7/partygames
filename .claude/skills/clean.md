---
name: clean
description: Limpa estado de desenvolvimento (processos, cache, node_modules se necessário)
tools: [Bash]
---

# Skill: /clean

Quando o usuário invocar `/clean`, siga estes passos:

1. **Matar processos nas portas do projeto**:
   - Porta 3001 (backend) e 5173 (frontend)
   - No Windows: `Get-Process node | Stop-Process` (cuidado — avise que isso mata TODOS os processos Node)
   - Alternativa mais segura: pergunte se o usuário quer matar todos os Node.js ou só os do projeto
2. **Limpar cache do Turborepo**:
   - Rode `pnpm turbo daemon clean` ou delete `.turbo/`
3. **Limpar cache do Vite** (se necessário):
   - Delete `apps/frontend/node_modules/.vite/`
4. **Reinstalar dependências** (se solicitado):
   - `pnpm install`
5. **Confirmação** — Informe que o ambiente está limpo e pronto para `pnpm dev`.

**Aviso**: SEMPRE confirme com o usuário antes de matar processos ou deletar arquivos.
