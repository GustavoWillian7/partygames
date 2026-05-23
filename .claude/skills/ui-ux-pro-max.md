---
name: ui-ux-pro-max
description: Integra e aplica as diretrizes da skill UI/UX Pro Max no projeto PastelariaGames
tools: [Read, Edit, Write, Bash]
---

# UI/UX Pro Max — Skill de Design Intelligence

## O que é

A [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) é uma engine de design intelligence que aplica **161 regras de raciocínio**, **67 estilos** e **99 diretrizes de UX** cobrindo:

- Best practices e anti-patterns
- Regras de acessibilidade (WCAG, contrastes, prefers-reduced-motion)
- Padrões por tipo de produto
- Checklists pré-entrega obrigatórias

## Instalação da CLI (opcional, para consultas avançadas)

```bash
npm install -g uipro-cli
uipro init --ai claude
```

Para consultar diretrizes específicas do React:

```bash
uipro query --stack react --topic "hover states"
```

## Diretrizes Obrigatórias no PastelariaGames

### 1. Interatividade — Cursor Pointer

**TODO elemento clicável deve ter `cursor-pointer`.**

Verifique:
- Botões customizados (GlassCard usado como botão, ícones clicáveis)
- Itens de lista interativos
- Badges pulsantes com ação

Exemplo de correção:
```tsx
// Antes (sem cursor-pointer)
<motion.button whileHover={{ scale: 1.02 }} ... />

// Depois
<motion.button
  whileHover={{ scale: 1.02 }}
  className="cursor-pointer ..."
  ...
/>
```

### 2. Contraste de Texto — Mínimo 4.5:1

**TODO texto em modo dark deve ter contraste WCAG AA (4.5:1).**

Verifique especialmente:
- `text-muted` (`#94A3B8`) sobre `bg-surface` (`#13162B`) — OK (~7.5:1)
- `text-primary` (`#7C3AED`) sobre `bg-background` (`#0B0D17`) — OK (~5.8:1)
- Botões ghost com bordas coloridas — garantir que o texto não fique abaixo de 4.5:1 no hover

### 3. prefers-reduced-motion

**Respeitar `prefers-reduced-motion` em TODAS as animações.**

O projeto usa Framer Motion extensivamente. Adicione a utilidade:

```tsx
// src/utils/motion.ts
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Uso nos componentes
<motion.div
  animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
  ...
/>
```

### 4. Touch Targets — Mínimo 48px

**TODO botão ou área clicável em mobile deve ter pelo menos 48px de altura.**

Verifique:
- `NeonButton` já usa `min-h-[48px]`?
- Ícones de ação em cards (settings, kick, close)
- Botões de votação no ImpostorGamePage

### 5. Estados de Loading e Feedback

**Toda ação assíncrona deve ter estado de loading + feedback de sucesso/erro.**

Verifique:
- `AuthPage`: login/registro tem spinner — OK
- `HomePage`: criar sala tem estado `isCreating` — OK
- `RoomPage`: kick player não tem loading visual — CORRIGIR
- `ImpostorGamePage`: enviar dica não tem loading — adicionar estado local se necessário

### 6. Focus Visible

**TODO elemento interativo deve ter outline visível no focus (teclado).**

Verifique:
- Inputs customizados (`GlowInput`) já têm focus ring?
- Botões com `tabIndex` devem mostrar `focus-visible:ring-2 focus-visible:ring-primary`
- Cards clicáveis precisam de `focus-visible` state

### 7. Consistência de Ícones

**Usar a MESMA biblioteca de ícones em TODO o projeto.**

✅ Já corrigido: usamos `lucide-react` em todo o frontend.
NUNCA misturar emojis com ícones. Sempre preferir ícones vetoriais.

### 8. Empty States

**Toda lista ou área de conteúdo deve ter um estado vazio amigável.**

Verifique:
- Sala sem jogadores — já tem UI
- Lista de dicas vazia — já tem condicional
- Histórico de palavras vazio — já tem condicional
- Votação sem votos — já tem condicional

### 9. Responsividade — Mobile-First

**O jogo deve ser jogável em telas de 320px+.**

Verifique:
- Grid de jogadores não quebra em telas pequenas
- Inputs não estouram a viewport
- Cards de votação cabem sem scroll horizontal
- Sidebar vira drawer em mobile — OK

### 10. Feedback Imediato

**Toda ação do usuário deve ter feedback visual em < 100ms.**

Verifique:
- Hover em botões — OK (scale + glow)
- Click em votar — OK (spinner)
- Marcar dupla — OK (glow + check)
- Envio de dica — adicionar estado "enviando" se necessário

## Como usar este skill no Claude Code

Digite `/ui-ux-pro-max` no chat para que o Claude:

1. Verifique se a CLI `uipro` está instalada (opcional)
2. Pergunte qual tela ou componente você quer auditar
3. Aplique as 10 diretrizes obrigatórias acima no arquivo escolhido
4. Gere um relatório de gaps encontrados + correções sugeridas

## Exemplo de uso

**Usuário:** `/ui-ux-pro-max`

**Claude:**
> Qual tela ou componente você quer auditar com as diretrizes UI/UX Pro Max?
> Opções: `AuthPage`, `HomePage`, `RoomPage`, `ImpostorGamePage`, `DuoChaosGamePage`, ou um componente específico.

**Usuário:** `ImpostorGamePage`

**Claude:**
> Auditando `ImpostorGamePage.tsx`...
> - [x] Cursor pointer em todos os botões
> - [x] Contraste de texto OK
> - [ ] prefers-reduced-motion não implementado
> - [x] Touch targets >= 48px
> - [ ] Focus visible ausente nos cards de votação
> Vou aplicar as correções?
