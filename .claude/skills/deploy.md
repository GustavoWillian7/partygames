---
name: deploy
description: Builda o projeto e envia para deploy no Render (ou remote configurado)
tools: [Bash, Read]
---

# Skill: /deploy

Quando o usuário invocar `/deploy`, siga estes passos:

1. **Build** — Rode `pnpm build` no root do projeto.
   - Se falhar, PARE imediatamente, mostre os erros e não prossiga.
2. **Verifique git status** — Rode `git status` e `git log --oneline -3`.
3. **Se houver mudanças unstaged/uncommitted**:
   - Liste os arquivos modificados.
   - Pergunte ao usuário se quer commitar antes do push.
   - Se sim, crie um commit com mensagem descritiva (pergunte qual ou use uma padrão tipo "deploy: atualização de <data>").
4. **Push** — Rode `git push origin main` (ou a branch atual).
5. **Confirmação** — Informe que o deploy foi enviado e o Render (ou CI) vai processar em alguns minutos.

**Avisos importantes**:
- NUNCA rode `git push --force`.
- Se o pre-commit hook falhar, corrija o problema e crie um NOVO commit (não amend).
