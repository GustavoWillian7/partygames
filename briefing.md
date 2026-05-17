# PartyGames — Bíblia do Projeto

> Documento vivo. Atualizar a cada decisão arquitetural, mudança de stack ou novo jogo.
> Versão: 1.2.0 — 2026-05-17

---

## 1. Visão Geral

Plataforma web multiplayer de **Party Games** para jogar com amigos.
- **Escopo inicial**: 2 jogos (`Jogo do Impostor`, `Encontre sua Dupla — Modo Caos`).
- **Meta técnica**: fullstack type-safe, comunicação em tempo real, código modular e escalável.
- **Público-alvo**: grupos de amigos (salas privadas, convite por código).

---

## 2. Stack Tecnológica

### 2.1 Front-end
| Tecnologia | Uso |
|------------|-----|
| **React 18+** | UI declarativa |
| **Vite** | Build tool e dev server |
| **TypeScript** | Tipagem estática em todo o ecossistema |
| **Tailwind CSS** | Estilização utilitária, responsiva |
| **Framer Motion** | Animações de entrada/saída, transições de tela, feedback visual |
| **Zustand** | Gerenciamento de estado global (jogo, sala, usuário) |
| **Socket.io-client** | Comunicação em tempo real com o servidor |
| **Zod** | Validação de schemas no client (eventos socket, formulários) |

### 2.2 Back-end
| Tecnologia | Uso |
|------------|-----|
| **Node.js** | Runtime |
| **Express** | HTTP server (health checks, auth REST) |
| **Socket.io** | Eventos em tempo real (WebSocket com fallback) |
| **TypeScript** | Tipagem estática |
| **Zod** | Validação de schemas (HTTP body + payload socket) |

### 2.3 Persistência & Cache
| Tecnologia | Uso |
|------------|-----|
| **Redis** | Estado transiente das salas, sessões ativas, presença de jogadores |
| **MongoDB + Mongoose** | Perfis de usuário, estatísticas de jogos, histórico de partidas |

### 2.4 Deploy (Fase 1 — Amigos)
- Hospedagem em serviço **gratuito/baixo custo** (ex: Render, Railway, Fly.io, ou VPS pequeno).
- **Futuro**: se houver necessidade de escalar, reavaliar infraestrutura.

---

## 3. Arquitetura de Software

### 3.1 Padrões Obrigatórios

| Padrão | Descrição |
|--------|-----------|
| **Feature-Based Architecture** | Cada jogo possui sua própria lógica isolada no front e no back. A lógica base (sistema de salas) é independente. |
| **Domain-Driven Handlers (Socket)** | Handlers de Socket.io separados por domínio: `room`, `impostor`, `duo-chaos`, `chat`, `auth`. |
| **Contract-First** | Interfaces TypeScript compartilhadas definem o contrato entre front e back antes da implementação. |
| **Fullstack Type Safety** | Os mesmos schemas Zod e tipos TypeScript devem ser reutilizados ou espelhados entre client e server. |

### 3.2 Fluxo de Dados Simplificado

```
┌─────────────┐      HTTP/REST       ┌──────────────┐
│   React     │ ◄──────────────────► │   Express    │  Auth, Health, Profile
│   (Vite)    │                      │   (Node.js)  │
│  Zustand    │                      └──────────────┘
│ Framer Mot. │
└──────┬──────┘      WebSocket        ┌──────────────┐
       │      ◄──────────────────►  │  Socket.io   │  Game state, chat, timers
       │                             │   Handlers   │
       │                             └──────┬───────┘
       │                                    │
       │                             ┌──────┴───────┐
       │                             │    Redis     │  Salas ativas, sessões,
       │                             │   (Cache)    │  timers, reconexão
       │                             └──────────────┘
       │                                    │
       │                             ┌──────┴───────┐
       │                             │   MongoDB    │  Perfis, estatísticas,
       │                             │  (Mongoose)  │  histórico de partidas
       │                             └──────────────┘
```

---

## 4. Estrutura de Pastas

### 4.1 Front-end (`/frontend`)

```
frontend/
├── public/
│   └── assets/
│       └── images/
├── src/
│   ├── main.tsx              # Entry point, providers
│   ├── App.tsx               # Router, layout base
│   ├── index.css             # Tailwind directives, tema global
│   │
│   ├── api/                  # Comunicação HTTP (auth, perfil)
│   │   └── axiosInstance.ts
│   │
│   ├── socket/               # Configuração e tipagem do Socket.io-client
│   │   ├── socket.ts
│   │   └── events.ts
│   │
│   ├── types/                # Tipos compartilhados (deve espelhar /shared)
│   │   ├── player.ts
│   │   ├── room.ts
│   │   ├── game.ts
│   │   └── index.ts
│   │
│   ├── store/                # Zustand stores
│   │   ├── useRoomStore.ts
│   │   ├── useGameStore.ts
│   │   └── usePlayerStore.ts
│   │
│   ├── hooks/                # Hooks customizados reutilizáveis
│   │   ├── useSocket.ts
│   │   └── useCountdown.ts
│   │
│   ├── components/           # Componentes UI genéricos
│   │   ├── ui/               # Botões, inputs, cards, toasts, skeletons
│   │   └── layout/           # Layouts de tela, nav, footer
│   │
│   ├── features/             # Módulos de domínio — cada um com sua lógica
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   │
│   │   ├── room/
│   │   │   ├── components/     # CreateRoom, JoinRoom, Lobby
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   │
│   │   ├── impostor/         # Jogo do Impostor (isolado)
│   │   │   ├── components/     # GameBoard, VotingScreen, RevealScreen
│   │   │   ├── hooks/
│   │   │   ├── utils/          # Lógica pura (cálculo de votos, etc.)
│   │   │   └── types.ts
│   │   │
│   │   └── duo-chaos/        # Encontre sua Dupla — Modo Caos (isolado)
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── utils/
│   │       └── types.ts
│   │
│   └── utils/                # Helpers globais (formatters, validators)
│
├── .env
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 4.2 Back-end (`/backend`) — Implementado

```
backend/
├── src/
│   ├── index.ts                # Entry point: Express + Socket.io + MongoDB
│   ├── config/                 # Variáveis de ambiente, conexões
│   │   ├── env.ts
│   │   ├── redis.ts            # Cliente ioredis (pub/sub + estado)
│   │   └── mongo.ts            # Conexão Mongoose (preparada, não usada ainda)
│   │
│   ├── data/                   # Bancos de dados hard-coded
│   │   └── themeGroups.ts      # Grupos de temas e palavras para os jogos
│   │
│   ├── middleware/             # Express middlewares
│   │   ├── errorHandler.ts
│   │   ├── authMiddleware.ts   # Validação JWT REST
│   │   └── validateRequest.ts  # Zod + Express
│   │
│   ├── modules/                # Domínios isolados
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts  # ⚠️ Usa Map em memória (MVP)
│   │   │   └── auth.schema.ts
│   │   │
│   │   └── room/               # ✅ Sala completa (CRUD + socket)
│   │       ├── room.handler.ts     # Socket.io handler (criar, entrar, sair, kick, settings, start)
│   │       ├── room.service.ts    # Regras + Redis persistence + timers
│   │       ├── room.schema.ts
│   │       └── room.types.ts
│   │
│   ├── events/
│   │   └── socketEvents.ts     # Registro central + handshake JWT + reconexão
│   │
│   └── socketRegistry.ts        # Mapa socketId/playerId para broadcast direcionado
│
├── .env
├── tsconfig.json
└── package.json
```

> **Nota:** Módulos `impostor/` e `duo-chaos/` criados e funcionais em `modules/`. Banco de palavras centralizado em `data/themeGroups.ts` com suporte a grupos de temas configuráveis.

### 4.3 Front-end (`/frontend`) — Implementado

```
frontend/
├── public/
│   └── assets/
│       └── images/
├── src/
│   ├── main.tsx              # Entry point, providers
│   ├── App.tsx               # React Router (/, /auth, /room/:roomId)
│   ├── index.css             # Tailwind directives + tema global
│   │
│   ├── pages/                # ⚠️ Páginas em nível global (MVP)
│   │   ├── AuthPage.tsx      # Login / Registro / Guest (unificado)
│   │   ├── HomePage.tsx      # Criar sala / Entrar sala / Logout
│   │   └── RoomPage.tsx      # Lobby + settings + start game
│   │
│   ├── socket/               # Socket.io-client + tipagem
│   │   ├── socket.ts         # Instância raw (fallback)
│   │   └── socketManager.ts  # getSocket / connectSocket / disconnectSocket
│   │
│   ├── store/                # Zustand stores (MVP — simplificado)
│   │   ├── useAuthStore.ts   # Token + player + métodos auth
│   │   └── useRoomStore.ts   # Estado da sala atual + mutations
│   │
│   ├── features/             # Ainda não populado (fase de jogos)
│   │   ├── auth/
│   │   ├── room/
│   │   ├── impostor/
│   │   └── duo-chaos/
│   │
│   ├── hooks/                 # Ainda não criado
│   ├── components/           # Ainda não criado (UI genérica inline nas pages)
│   └── utils/               # Ainda não criado
│
├── .env
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

> **Nota:** Para a fase de jogos, as páginas globais devem migrar para `features/*/pages/` conforme estrutura original (seção 4.1).

### 4.3 Shared (`/shared`) — (Opcional, mas recomendado para type-safety total)

```
shared/
├── types/
│   ├── player.ts
│   ├── room.ts
│   ├── game.ts
│   └── socket.ts
├── schemas/
│   ├── room.schema.ts
│   ├── player.schema.ts
│   └── game.schema.ts
└── constants/
    └── game.ts
```

> **Nota**: se não usar monorepo, os arquivos de `/shared` devem ser duplicados/espelhados manualmente entre `frontend/src/types` e `backend/src/types`.

---

## 5. Interfaces TypeScript (Contratos)

### 5.1 Player (Jogador)

```typescript
// shared/types/player.ts

export type PlayerStatus = 'online' | 'offline' | 'disconnected' | 'spectator';

export interface Player {
  id: string;                    // UUID do jogador
  socketId: string;              // ID da conexão Socket.io (volátil)
  name: string;                  // Nickname
  avatarUrl?: string;            // URL do avatar (opcional)
  status: PlayerStatus;
  isHost: boolean;               // true = criador da sala
  score: number;                 // Pontuação acumulada na sessão
  createdAt: Date;
}

export interface PlayerProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  totalGames: number;
  totalWins: number;
  favoriteGame?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Room (Sala)

```typescript
// shared/types/room.ts

export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'paused';
export type GameType = 'impostor' | 'duo-chaos';

export interface RoomSettings {
  maxPlayers: number;            // Padrão: 8
  roundTimeSeconds: number;      // Tempo por rodada (padrão: 60s)
  allowReconnection: boolean;    // true (padrão)
  isPublic: boolean;             // false = privada (padrão)
  themeGroup?: string;           // Grupo de temas para sorteio de palavras (ex: 'harry-potter', 'filmes')
}

export interface Room {
  id: string;                    // Código da sala (ex: "ABCD")
  name: string;
  hostId: string;                // ID do jogador host
  players: Player[];
  status: RoomStatus;
  currentGame?: GameType;
  settings: RoomSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 Game (Estado Genérico do Jogo)

```typescript
// shared/types/game.ts

export type GamePhase = 'lobby' | 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';

export interface GameState {
  gameType: GameType;
  phase: GamePhase;
  currentRound: number;
  totalRounds?: number;          // undefined = sem limite (ex: duo-chaos)
  turnPlayerId?: string;         // Jogador da vez
  timeRemaining: number;         // Segundos restantes no turno/rodada
  players: Player[];
  eliminatedPlayerIds: string[];
  winnerIds?: string[];
  metadata: Record<string, unknown>; // Dados específicos do jogo (palavras, duplas, etc.)
}

// Jogo do Impostor — Metadados específicos
export interface ImpostorMetadata {
  secretWord: string;
  impostorTheme: string;
  impostorIds: string[];
  cluesGiven: Record<string, string[]>; // playerId -> lista de dicas
  votes: Record<string, string>;        // voterId -> votedId
}

// Encontre sua Dupla — Metadados específicos
export interface DuoChaosMetadata {
  pairs: Record<string, string>;      // playerId -> partnerId (definido pelo servidor)
  impostorIds: string[];
  markedPair: Record<string, string>;   // playerId -> quem ele marcou como dupla
  chatHistory: ChatMessage[];
}

export interface ChatMessage {
  playerId: string;
  word: string;                  // Palavra enviada (máx. 1 por turno)
  timestamp: Date;
}
```

### 5.4 Socket Events (Contratos de Evento)

```typescript
// shared/types/socket.ts

// ===================== CLIENT -> SERVER =====================

export interface ClientEvents {
  // Auth
  'auth:login': (payload: { email: string; password: string }) => void;
  'auth:register': (payload: { name: string; email: string; password: string }) => void;
  'auth:guest': (payload: { name: string }) => void;

  // Room
  'room:create': (payload: { name: string; settings?: Partial<RoomSettings> }) => void;
  'room:join': (payload: { roomId: string }) => void;
  'room:leave': () => void;
  'room:kick': (payload: { playerId: string }) => void;
  'room:update-settings': (payload: Partial<RoomSettings>) => void;
  'room:start-game': (payload: { gameType: GameType }) => void;

  // Jogo do Impostor
  'impostor:send-clue': (payload: { word: string }) => void;
  'impostor:vote': (payload: { votedPlayerId: string | null }) => void;

  // Encontre sua Dupla
  'duo-chaos:send-word': (payload: { word: string }) => void;
  'duo-chaos:mark-pair': (payload: { targetPlayerId: string }) => void;
}

// ===================== SERVER -> CLIENT =====================

export interface ServerEvents {
  // Auth
  'auth:success': (payload: { player: PlayerProfile; token: string }) => void;
  'auth:error': (payload: { message: string }) => void;

  // Room
  'room:state': (payload: Room) => void;
  'room:player-joined': (payload: { player: Player }) => void;
  'room:player-left': (payload: { playerId: string; newHostId?: string }) => void;
  'room:player-reconnected': (payload: { player: Player }) => void;
  'room:error': (payload: { message: string }) => void;
  'room:game-started': (payload: { gameType: GameType; initialState: GameState }) => void;

  // Jogo do Impostor
  'impostor:round-start': (payload: { round: number; timeRemaining: number; yourWord?: string; yourTheme?: string }) => void;
  'impostor:clue-received': (payload: { playerId: string; word: string }) => void;
  'impostor:voting-start': (payload: { players: Player[] }) => void;
  'impostor:vote-received': (payload: { voterId: string; votedId: string | null }) => void;
  'impostor:reveal': (payload: { eliminatedId: string; wasImpostor: boolean; impostorIds: string[] }) => void;
  'impostor:game-over': (payload: { winnerIds: string[]; reason: string }) => void;

  // Encontre sua Dupla
  'duo-chaos:turn-start': (payload: { turnPlayerId: string; timeRemaining: number }) => void;
  'duo-chaos:word-received': (payload: { playerId: string; word: string }) => void;
  'duo-chaos:pair-marked': (payload: { playerId: string; targetId: string }) => void;
  'duo-chaos:game-over': (payload: { winnerIds: string[]; reason: string }) => void;

  // Global
  'error': (payload: { code: string; message: string }) => void;
  'notification': (payload: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => void;
}
```

---

## 6. Eventos Socket.io — Especificação Detalhada

### 6.1 Ciclo de Vida de uma Sala

| Evento (C->S) | Payload | Descrição |
|----------------|---------|-----------|
| `room:create` | `{ name, settings? }` | Jogador cria sala e vira host. Retorna `room:state`. |
| `room:join` | `{ roomId }` | Entra em sala existente. Retorna `room:state` para todos. |
| `room:leave` | — | Sai da sala. Se for host, transfere para o próximo jogador (`newHostId`). |
| `room:kick` | `{ playerId }` | Host remove jogador. |
| `room:update-settings` | `Partial<RoomSettings>` | Host altera regras da sala. |
| `room:start-game` | `{ gameType }` | Host inicia o jogo escolhido. |

| Evento (S->C) | Payload | Disparado quando... |
|---------------|---------|---------------------|
| `room:state` | `Room` | Estado completo da sala (snapshot). |
| `room:player-joined` | `{ player }` | Novo jogador entra. |
| `room:player-left` | `{ playerId, newHostId? }` | Jogador sai ou é kickado. |
| `room:player-reconnected` | `{ player }` | Jogador retorna após queda de conexão. |
| `room:game-started` | `{ gameType, initialState }` | Jogo inicia. |
| `room:error` | `{ message }` | Erro de sala (código inválido, cheia, etc.). |

### 6.2 Jogo do Impostor — Fluxo de Eventos

```
room:start-game (gameType: 'impostor')
    │
    ▼
impostor:round-start (round: 1, timeRemaining, yourWord/yourTheme)
    │
    ├──► jogador envia dica ──► impostor:send-clue (word)
    │                              └──► broadcast impostor:clue-received
    │
    ▼ (após todas as dicas ou timeout)
impostor:voting-start (lista de jogadores)
    │
    ├──► jogador vota ──► impostor:vote (votedPlayerId | null)
    │                        └──► broadcast impostor:vote-received
    │
    ▼ (após todos votarem ou timeout)
impostor:reveal (eliminado, era impostor?, lista de impostores)
    │
    ├──► Se jogo continua ──► impostor:round-start (round: 2 ...)
    │
    └──► Se jogo acaba ──► impostor:game-over (winnerIds, reason)
```

**Regras de negócio**:
- O impostor recebe `yourTheme`. Os inocentes recebem `yourWord`.
- Cada jogador deve dar exatamente 1 palavra por rodada.
- Voto nulo é permitido (`votedPlayerId: null`).
- O mais votado é eliminado. Empate = ninguém eliminado.
- O jogo termina quando todos os impostores são eliminados (vitória inocente) ou quando inocentes = impostores (vitória impostor).

### 6.3 Encontre sua Dupla (Modo Caos) — Fluxo de Eventos

```
room:start-game (gameType: 'duo-chaos')
    │
    ▼
duo-chaos:turn-start (turnPlayerId, timeRemaining)
    │
    ├──► jogador da vez envia palavra ──► duo-chaos:send-word (word)
    │                                      └──► broadcast duo-chaos:word-received
    │
    ├──► qualquer jogador marca dupla ──► duo-chaos:mark-pair (targetPlayerId)
    │                                      └──► broadcast duo-chaos:pair-marked
    │
    ▼ (se dois jogadores se marcarem mutuamente)
duo-chaos:game-over (winnerIds, reason)
    │
    └──► Se marcaram impostor, impostor vence.
    └──► Se acharam dupla sem impostor, dupla vence.
```

**Regras de negócio**:
- Distribuição assimétrica: 1 dupla + 1 pessoa sozinha + 1 impostor (mínimo 3 jogadores).
- O jogo **não tem limite de rodadas**.
- Termina quando dois jogadores se marcam mutuamente como dupla.
- Se um deles for impostor → impostor vence.
- Se ambos forem a dupla real → dupla vence.

---

## 7. Autenticação & Autorização

### 7.1 Estratégia (Fase 1)
- **JWT (JSON Web Token)** armazenado em `localStorage`.
- **Guest Mode**: jogadores podem entrar sem cadastro (apenas nickname).
- **Registro/Login**: email + senha. Senha hasheada com bcrypt no back-end.
- **Middleware `authMiddleware`**: valida JWT em rotas protegidas e injeta `req.playerId`.

### 7.2 Fluxo
1. Usuário faz login/registro via REST (`POST /api/auth/login` ou `/api/auth/register`).
2. Server retorna JWT + perfil.
3. Client armazena token e o envia no header `Authorization: Bearer <token>`.
4. Ao conectar no Socket.io, o client envia o token no handshake (`auth: { token }`).
5. Server valida token no handshake e associa `socket.playerId`.

---

## 8. Regras de Negócio do Sistema de Salas

| Regra | Descrição |
|-------|-----------|
| **Código da Sala** | 4 caracteres alfanuméricos maiúsculos (ex: `ABCD`). Gerado automaticamente. |
| **Limite de Jogadores** | Máximo 8 por padrão (configurável pelo host, mínimo 3). |
| **Host** | Criador da sala. Único com permissão de kick, alterar settings e iniciar jogo. |
| **Transferência de Host** | Se o host sair, o próximo jogador na lista (`players[0]` que não seja o host) assume. |
| **Reconexão** | Se um jogador cair (`socket.disconnect`), ele tem **60 segundos** para retornar com o mesmo `playerId`. Se não retornar, é removido da sala. |
| **Espectador** | Jogadores que entram após o início do jogo entram como `spectator` (não jogam, apenas assistem). |
| **Sala vazia** | Se o último jogador sair, a sala é destruída após 30 segundos. |

---

## 9. UX/UI — Diretrizes de Implementação

### 9.1 Paleta de Cores (Tailwind)

```javascript
// tailwind.config.js (extend colors)
colors: {
  background: '#0f172a',        // slate-900
  surface:    '#1e293b',        // slate-800
  primary:    '#8b5cf6',        // violet-500
  accent:     '#a3e635',        // lime-400
  info:       '#22d3ee',        // cyan-400
  danger:     '#ef4444',        // red-500
  success:    '#22c55e',        // green-500
  text:       '#f8fafc',        // slate-50
  muted:      '#94a3b8',        // slate-400
}
```

### 9.2 Componentes de Feedback Obrigatórios

| Situação | Componente | Biblioteca |
|----------|-----------|------------|
| Notificações gerais | Toast | `sonner` ou `react-hot-toast` |
| Carregamento inicial | Skeleton | Tailwind `animate-pulse` |
| Transição de telas | Animação de entrada/saída | Framer Motion (`AnimatePresence`) |
| Revelação do impostor | Animação dramática | Framer Motion (scale + opacity) |
| Timer de rodada | Contador regressivo visual | CSS + `useCountdown` hook |
| Voto confirmado | Micro-interação (shake/check) | Framer Motion |

### 9.3 Layout Responsivo
- **Mobile-first**: o jogo deve ser jogável em celular (telas de 320px+).
- **Botões mínimos**: 48px de altura para touch.
- **Área de jogo centralizada**: evitar poluição visual durante a partida.

---

## 10. Decisões Técnicas & Roadmap

### 10.1 Decisões Tomadas

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-04-29 | Redis para estado transiente, MongoDB para persistência | Redis = baixa latência para jogos em tempo real. MongoDB = flexibilidade para perfis/estatísticas. |
| 2026-04-29 | Zustand no lugar de Redux | Menos boilerplate, ideal para estado de jogo sincronizado via Socket. |
| 2026-04-29 | Guest mode habilitado | Facilita jogar com amigos sem barreira de cadastro. |
| 2026-04-29 | Reconexão de 60s | Balanceia UX (voltar após queda) com limpeza de estado (não manter salas fantasmas). |
| 2026-05-10 | Auth com Map em memória (MVP) | MongoDB conectado, mas auth ainda usa `Map` local para agilizar desenvolvimento. Migração para Mongoose planejada antes do deploy. |
| 2026-05-10 | Auth migrado para MongoDB/Mongoose | `User` schema criado, `auth.service.ts` reescrito para usar Mongoose. Dados de usuários agora persistem entre restarts. |
| 2026-05-10 | Socket.io registry (`socketRegistry.ts`) | Mapa em memória no back-end para localizar sockets por `playerId` (usado em kick, reconexão). Alternativa a rooms do Socket.io para casos pontuais. |

### 10.2 Roadmap

- [x] Definição da arquitetura e stack
- [x] Estrutura de pastas
- [x] Contratos TypeScript e eventos Socket
- [x] Configuração do monorepo (Turborepo + pnpm workspaces)
- [x] Setup do Tailwind + tema dark
- [x] Implementação do módulo `auth` (registro/login/guest via REST + JWT)
- [x] Implementação do módulo `room` (criar, entrar, sair, kick, settings, transferir host, reconexão, destruição automática)
- [x] Telas de lobby (AuthPage, HomePage, RoomPage)
- [x] Implementação do `Jogo do Impostor` (frontend + backend)
  - [x] Backend: handler, service, logic, types, schema em `modules/impostor/`
  - [x] Frontend: ImpostorGamePage com fases playing, voting, reveal, finished
  - [x] Hook `useImpostorGame` com timers e sincronização socket
  - [x] Eventos adicionais: `impostor:request-state`, `impostor:state`
- [x] Implementação do `Encontre sua Dupla` (frontend + backend)
  - [x] Backend: handler, service, logic, types, schema em `modules/duo-chaos/`
  - [x] Frontend: DuoChaosGamePage com turnos, envio de palavras, marcação de dupla
  - [x] Hook `useDuoChaosGame` com timers e sincronização socket
  - [x] Eventos adicionais: `duo-chaos:request-state`, `duo-chaos:state`
- [x] Telas de votação e resultado dos jogos (ambos concluídos)
- [x] Sistema de grupos de temas (theme groups)
  - [x] Banco hard-coded em `data/themeGroups.ts` com 14 grupos (Harry Potter, Animais, Esportes, Comidas, Filmes, Animes, Jogos, Séries, Futebol, Música, Tecnologia, Livros, Mitologia + Aleatório)
  - [x] Cada grupo com 22 entradas para Impostor e Duo Chaos
  - [x] `themeGroup` adicionado a `RoomSettings` (shared + backend + frontend)
  - [x] Dropdown de seleção de tema no lobby (RoomPage.tsx)
  - [x] Lógica de sorteio filtra por grupo escolhido
- [ ] Testes de integração dos fluxos Socket
- [ ] Deploy inicial (ambiente de amigos)

---

## 11. Glossário

| Termo | Significado |
|-------|-------------|
| **Host** | Jogador dono da sala, com privilégios administrativos. |
| **Sala** | Instância de jogo identificada por um código de 4 caracteres. |
| **Rodada** | Ciclo de jogada dentro de um jogo (ex: rodada de dicas no Impostor). |
| **Turno** | Momento em que um jogador específico deve agir. |
| **Dupla** | Par de jogadores designados secretamente no `duo-chaos`. |
| **Impostor** | Jogador com objetivo contrário ao grupo. |
| **Reconexão** | Mecanismo que permite um jogador retornar à sala após queda de conexão. |

---

---

## 12. Estado Atual & Bloqueios Conhecidos (2026-05-17)

| Item | Status | Detalhe |
|------|--------|---------|
| Monorepo + build | ✅ Funcionando | `pnpm dev` sobe front (5173) e back (3001) |
| Auth REST | ✅ Funcionando | Login, registro, guest com JWT no `localStorage` |
| Auth persistência | ✅ MongoDB | Schema `User` em Mongoose. Registro, login e guest persistem entre restarts |
| MongoDB | ✅ Funcionando | `connectMongo()` rodando + schema `User` em produção |
| Redis | ✅ Funcionando | Estado de salas, timers de reconexão e limpeza |
| Salas (CRUD) | ✅ Funcionando | Criar, entrar, sair, kick, settings, transferência de host |
| Reconexão | ✅ Funcionando | 60s de janela, reentrada automática no socketEvents |
| Lobby (frontend) | ✅ Funcionando | AuthPage → HomePage → RoomPage com navegação e estado Socket |
| Socket.io registry | ✅ Funcionando | `socketRegistry.ts` mapeia `playerId` → `Socket` |
| Jogo do Impostor | ✅ Corrigido (v1.2) | Civis recebem a **palavra secreta**, impostor recebe só o **tema** + aviso "Você é o impostor!". O impostor deve dar dicas que se encaixem no tema sem saber a palavra. Frontend mostra UI diferente para impostor vs civil |
| Encontre sua Dupla | ✅ Corrigido (v1.1) | Jogadores recebem **palavra secreta** em vez de ver sua função (impostor/dupla/solo). A dupla recebe a mesma palavra, forasteiros (impostor/solo) recebem outra palavra. A graça é descobrir quem tem a mesma palavra pelas dicas |
| Lógica de palavras (ambos jogos) | ✅ Implementado | Banco de pares de palavras por tema (ex: civis="Messi" / impostor="CR7", tema="Jogadores de futebol"). 16 pares cadastrados |
| Rotas de jogo | ✅ Completo | `/game/impostor` e `/game/duo-chaos` adicionadas ao `App.tsx` |
| Testes de integração | ✅ Manual (MVP) | Scripts de teste automatizado validaram fluxos completos do Impostor (3 jogadores) e Duo Chaos (3 jogadores). Timers, votação, revelação, marcação mútua e game-over funcionando |
| Tratamento de erros (backend) | ✅ Corrigido | Controllers async agora capturam erros e passam para `next(err)`. Error handler retorna 401/409/400/500 conforme o caso. Antes, erros de auth crashavam o servidor |
| MongoDB Atlas (local) | ✅ Conectado | URI direta (sem `+srv`) usada para evitar bug de DNS SRV no Node.js Windows. Formato: `mongodb://user:pass@host1:27017,host2:27017,host3:27017/db?ssl=true&replicaSet=...` |
| Redis (Upstash) | ✅ Conectado | TLS ativado (`rediss://`). Plano free do Upstash funcionando |
| Shutdown gracioso | ✅ Implementado | Ao receber SIGINT/SIGTERM, o servidor: (1) emite `server:shutdown` para todos os sockets, (2) desconecta todos os jogadores, (3) limpa todas as chaves `room:*`, `game:*` e `socket:*` do Redis, (4) fecha HTTP server e Socket.io, (5) desconecta do Redis. Frontend mostra alert e redireciona para home |
| Sala volta ao lobby após game over | ✅ Corrigido (v1.3) | Ambos os jogos agora chamam `onGameFinished` ao terminar, que atualiza a sala para `status: 'waiting'` e `currentGame: undefined`. Frontend emite `room:leave` ao clicar "Voltar ao Início", limpando o estado local |
| Impostor recebe tema | ✅ Corrigido (v1.3) | Adicionado `isImpostor` ao tipo `ServerEvents` do Socket.io (`impostor:round-start` e `impostor:state`). Agora o frontend identifica corretamente quem é impostor e mostra o tema |
| Marcar dupla só após 1 rodada | ✅ Corrigido (v1.3) | No Duo Chaos, `markPair` agora verifica se todos os jogadores falaram pelo menos 1 palavra (`chatHistory` tem entrada de cada `activePlayerId`). Se não, retorna erro "Aguarde todos os jogadores falarem pelo menos 1 vez" |
| Grupos de temas | ✅ Implementado (v1.4) | Host pode escolher um grupo de temas no lobby (`themeGroup` em `RoomSettings`). O sorteio de palavras filtra pelo grupo escolhido. 14 grupos disponíveis com ~22 entradas cada. Fallback para "Aleatório" se nenhum grupo for selecionado |

### Próximo passo recomendado
1. Adicionar testes de integração automatizados (jest + socket.io-client) para regressão futura.
2. Preparar deploy inicial (ambiente de amigos) — Render, Railway ou VPS.

---

*Última atualização: 2026-05-17 (v1.4 — sistema de grupos de temas, expansão do banco de palavras para 14 grupos com ~22 entradas cada, atualização do briefing)*
