# PastelariaGames

Monorepo da plataforma PastelariaGames — jogos multiplayer para jogar com amigos.

## Estrutura

Este monorepo usa [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io) workspaces.

```
.
├── apps/
│   ├── frontend/          # React + Vite + Tailwind + Socket.io-client
│   └── backend/           # Node + Express + Socket.io + Redis + MongoDB
├── packages/
│   └── shared/            # Tipos TypeScript e schemas Zod compartilhados
├── turbo.json             # Pipeline de build e dev do Turborepo
├── pnpm-workspace.yaml    # Definição dos workspaces
└── package.json           # Root package.json
```

## Pré-requisitos

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io/installation) >= 8
- [Redis](https://redis.io) rodando localmente (ou Docker)
- [MongoDB](https://mongodb.com) rodando localmente (ou Docker)

## Instalação

```bash
pnpm install
```

## Desenvolvimento

Rode front-end e back-end em paralelo:

```bash
pnpm dev
```

Ou rode separadamente:

```bash
pnpm --filter @partygames/frontend dev
pnpm --filter @partygames/backend dev
```

## Build

```bash
pnpm build
```

## Tecnologias

- **Front-end**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand, Socket.io-client
- **Back-end**: Node.js, Express, TypeScript, Socket.io, Redis, MongoDB (Mongoose), Zod
- **Monorepo**: Turborepo, pnpm workspaces

---

> Veja o [briefing.md](./briefing.md) para a documentação completa do projeto.
