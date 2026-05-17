---
name: game-test
description: Roda testes manuais automatizados para validar fluxos de jogo (Impostor e Duo Chaos)
tools: [Bash, Read]
---

# Skill: /game-test

Quando o usuário invocar `/game-test`, siga estes passos:

1. **Pergunte qual jogo testar**: `impostor`, `duo-chaos` ou `ambos`.
2. **Pergunte quantos jogadores** (mínimo 3, máximo recomendado 6 para teste rápido).
3. **Verifique se o backend está rodando** — tente conectar no Socket.io local (`http://localhost:3001`).
   - Se não estiver, avise para rodar `pnpm dev` primeiro.
4. **Rode o script de teste** — se existir um script em `scripts/test-game.ts`, execute com `tsx`.
   - Se não existir, simule verbalmente o fluxo:
     - Cria sala → Jogador 1 (host)
     - Entra com código → Jogador 2, Jogador 3...
     - Host inicia o jogo
     - Verifica se `game-started` foi recebido por todos
     - Simula 1 rodada de jogada
     - Verifica se não houve erro de estado
5. **Relatório** — Informe o resultado: passou ou falhou em qual etapa.

**Nota**: Este skill não substitui testes unitários/integração. É um smoke test rápido.
