---
name: logs
description: Mostra logs recentes do backend (Render ou local)
tools: [Bash, Read]
---

# Skill: /logs

Quando o usuário invocar `/logs`, siga estes passos:

1. **Pergunte a fonte**:
   - `local` — logs do terminal onde `pnpm dev` está rodando
   - `render` — logs do deploy no Render.com
2. **Se for `local`**:
   - Não é possível ver logs de outro terminal. Sugira que o usuário rode `pnpm dev` no terminal do Claude com `! pnpm --filter @partygames/backend dev`.
3. **Se for `render`**:
   - Pergunte o nome do serviço (ex: `partygames-backend`) ou use o padrão.
   - Rode `render logs --tail` (se CLI do Render estiver instalado).
   - Se não estiver instalado, oriente o usuário a acessar `dashboard.render.com` → serviço → Logs.
4. **Filtro opcional** — pergunte se quer filtrar por palavra-chave (ex: "error", "room", "redis").

**Dica**: Para logs em tempo real do backend local, use o comando `! pnpm --filter @partygames/backend dev` no chat.
