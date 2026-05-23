# PastelariaGames — Claude Skills

> Comandos customizados disponíveis para automação de tarefas recorrentes no projeto.

## Como usar

Dentro do Claude Code, digite `/nome-do-skill` no chat. O Claude seguirá o roteiro automatizado definido no arquivo de skill.

Os arquivos de skill ficam em `.claude/skills/`.

---

## Skills Disponíveis

### `/deploy`
Builda o projeto e envia para deploy no Render.

1. Roda `pnpm build` (para se houver erro)
2. Verifica `git status`
3. Pergunta se quer commitar mudanças pendentes
4. Faz `git push origin main`
5. Confirma que o deploy foi enviado

---

### `/add-theme`
Adiciona um novo grupo de temas ao banco de palavras dos jogos.

1. Pergunta o nome do tema (ex: "futebol", "filmes")
2. Pergunta quantas entradas
3. Para cada entrada, coleta: palavra dos civis, palavra do impostor, tema geral
4. Atualiza `apps/backend/src/data/themeGroups.ts`
5. Atualiza o dropdown em `apps/frontend/src/pages/RoomPage.tsx`
6. Builda para validar

---

### `/game-test`
Roda um smoke test rapido nos fluxos de jogo.

1. Pergunta qual jogo (`impostor`, `duo-chaos` ou `ambos`)
2. Pergunta quantos jogadores simular
3. Verifica se o backend esta rodando localmente
4. Simula o fluxo: criar sala -> entrar -> iniciar -> 1 rodada
5. Relata se passou ou falhou

---

### `/logs`
Mostra logs do backend.

1. Pergunta se quer logs `local` ou `render`
2. Se for local, orienta a rodar o backend no terminal do Claude
3. Se for Render, tenta usar a CLI ou orienta acessar o dashboard
4. Pergunta se quer filtrar por palavra-chave (ex: "error", "redis")

---

### `/clean`
Limpa o ambiente de desenvolvimento.

1. Pergunta se quer matar processos Node (com cuidado!)
2. Limpa cache do Turborepo
3. Limpa cache do Vite (se necessario)
4. Reinstala dependencias (se solicitado)

---

### `/ui-ux-pro-max`
Audita e aplica diretrizes de UX no projeto com base na skill UI/UX Pro Max.

1. Pergunta qual tela/componente auditar
2. Aplica as 10 diretrizes obrigatórias (cursor-pointer, contraste, reduced-motion, touch targets, loading states, focus visible, consistência de ícones, empty states, responsividade, feedback imediato)
3. Gera relatório de gaps + correções sugeridas

---

## Como criar um novo Skill

1. Crie um arquivo `.md` em `.claude/skills/`
2. No topo, coloque o frontmatter:
   ```yaml
   ---
   name: nome-do-skill
   description: Breve descricao do que faz
   tools: [Bash, Read, Edit, Write]
   ---
   ```
3. Escreva as instrucoes em linguagem natural
4. Use com `/nome-do-skill`
