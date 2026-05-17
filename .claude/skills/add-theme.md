---
name: add-theme
description: Adiciona um novo grupo de temas ao banco de palavras (data/themeGroups.ts) e atualiza o dropdown no frontend
tools: [Read, Edit, Write, Bash]
---

# Skill: /add-theme

Quando o usuário invocar `/add-theme`, siga estes passos:

1. **Pergunte o nome do grupo de temas** (ex: "harry-potter", "filmes", "comidas").
   - Use kebab-case para o ID.
2. **Pergunte quantas entradas ele quer adicionar** (mínimo recomendado: 10).
3. **Para cada entrada**, pergunte:
   - `word` — palavra para os civis/dupla (ex: "Leão")
   - `outsider` — palavra para o impostor/solo (ex: "Tigre")
   - `theme` — tema geral (ex: "Animais Selvagens")
4. **Leia `apps/backend/src/data/themeGroups.ts`** e adicione o novo grupo no objeto `THEME_GROUPS`.
5. **Atualize o frontend** — leia `apps/frontend/src/pages/RoomPage.tsx` e adicione o novo grupo no array `THEME_GROUPS` (linha do dropdown).
6. **Build** — Rode `pnpm build` para garantir que não quebrou nada.
7. **Confirmação** — Informe que o tema foi adicionado com sucesso e quantas entradas ele tem agora.

**Regras**:
- Cada grupo deve ter pelo menos uma entrada com `word`, `outsider` e `theme`.
- Não aceite duplicatas de ID de grupo.
