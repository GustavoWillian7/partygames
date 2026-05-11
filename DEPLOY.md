# Guia de Deploy — PartyGames (Gratuito)

> Este guia cobre o deploy completo da plataforma PartyGames usando apenas serviços gratuitos.

---

## 1. Visão Geral da Infraestrutura

| Serviço | Plataforma | Plano | Uso |
|---------|-----------|-------|-----|
| **Backend (Node.js)** | Render | Free | API REST + Socket.io |
| **Frontend (React/Vite)** | Render | Free (Static) | SPA estática |
| **MongoDB** | MongoDB Atlas | M0 (Free) | Persistência de usuários |
| **Redis** | Upstash | Free | Estado transiente das salas |

---

## 2. Pré-requisitos

- Conta no [Render](https://render.com)
- Conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
- Conta no [Upstash](https://upstash.com)
- Repositório no GitHub com o código do projeto
- **Node.js >= 18** e **pnpm >= 8** instalados localmente

---

## 3. Configurar MongoDB Atlas (Free)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas) e crie uma conta.
2. Crie um novo cluster **M0 (Shared)** — é gratuito e não expira.
3. Escolha a região mais próxima de onde o backend será hospedado (ex: `us-east-1` para Render).
4. Em **Database Access**, crie um usuário com senha forte.
5. Em **Network Access**, adicione `0.0.0.0/0` para permitir conexões de qualquer IP (necessário para serviços em nuvem como Render).
6. Clique em **Connect → Drivers → Node.js** e copie a connection string.
7. Guarde a string no formato:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/partygames?retryWrites=true&w=majority
   ```
---

## 4. Configurar Upstash Redis (Free)

1. Acesse [Upstash](https://console.upstash.com) e crie uma conta.
2. Clique em **Create Database**.
3. Escolha a região mais próxima do seu backend.
4. Após criar, copie os dados de conexão:
   - **Endpoint** (ex: `valid-mastiff-12345.upstash.io`)
   - **Port** (geralmente `6379`)
   - **Password**
   5. Guarde essas informacoes. O backend espera no formato:
      ```
      REDIS_URL=rediss://default:<password>@<endpoint>:6379
      ```

---

## 5. Preparar o Repositório

### 5.1. Verificar builds locais

```bash
pnpm install
pnpm build
```

Ambos `apps/backend` e `apps/frontend` devem compilar sem erros.

### 5.2. Criar `.gitignore` adequado (se ainda não existir)

Certifique-se de que `.env` dos apps não está versionado:

```gitignore
# Apps
apps/backend/.env
apps/frontend/.env

# Geral
node_modules/
dist/
*.log
```

### 5.3. Commit e push para o GitHub

```bash
git add .
git commit -m "Preparando para deploy"
git push origin main
```

---

## 6. Deploy do Backend no Render

### 6.1. Criar Web Service

1. No dashboard do Render, clique em **New + → Web Service**.
2. Conecte seu repositório do GitHub.
3. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `partygames-backend` |
| **Environment** | `Node` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `node apps/backend/dist/index.js` |
| **Plan** | `Free` |

4. Em **Environment Variables**, adicione:

| Variable | Valor (exemplo) |
|----------|----------------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://...` (string do Atlas) |
| `REDIS_URL` | `rediss://default:<password>@<endpoint>:6379` |
| `JWT_SECRET` | `<alguma-string-secreta-longa>` |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://<nome-do-frontend>.onrender.com` |

> **Dica:** `JWT_SECRET` deve ser uma string aleatória de 32+ caracteres. Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

5. Clique em **Create Web Service**.

### 6.2. Notas sobre o plano Free do Render

- O serviço "dorme" após 15 minutos de inatividade.
- Ao receber uma nova requisição, leva ~30s para "acordar".
- Para evitar sleep em desenvolvimento ativa, use um serviço de ping gratuito como [UptimeRobot](https://uptimerobot.com) (plano gratuito permite 50 monitores).

---

## 7. Deploy do Frontend no Render

### 7.1. Criar Static Site

1. No dashboard do Render, clique em **New + → Static Site**.
2. Conecte o mesmo repositório.
3. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `partygames-frontend` |
| **Environment** | `Node` |
| **Build Command** | `pnpm install && pnpm build` |
| **Publish Directory** | `apps/frontend/dist` |
| **Plan** | `Free` |

4. Em **Environment Variables**, adicione:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://<nome-do-backend>.onrender.com` |

5. Clique em **Create Static Site**.

### 7.2. Redirecionamento SPA (importante!)

O frontend usa React Router. É necessário configurar o redirecionamento para `index.html` em rotas desconhecidas.

1. No dashboard do site estático, vá em **Redirects/Rewrites**.
2. Adicione uma regra:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

---

## 8. Configurar CORS no Backend

Após o deploy, atualize a variável `CORS_ORIGIN` no backend para apontar para a URL exata do frontend:

```
CORS_ORIGIN=https://partygames-frontend.onrender.com
```

Isso impede que outros domínios acessem sua API.

---

## 9. Testar o Deploy

1. Acesse a URL do frontend (ex: `https://partygames-frontend.onrender.com`).
2. Teste o fluxo:
   - Criar conta como guest
   - Criar uma sala
   - Entrar em uma sala com outro dispositivo/navegador
   - Iniciar um jogo (Impostor ou Duo Chaos)

3. Verifique os logs do backend no dashboard do Render caso algo falhe.

---

## 10. Limitações do Plano Gratuito

| Recurso | Limite Free |
|---------|-------------|
| Backend | Sleep após 15min inativo; 512MB RAM; banda limitada |
| Frontend (Static) | 100GB/mês de banda; build limitado |
| MongoDB Atlas M0 | 512MB storage; limitado a conexões simultâneas |
| Upstash Redis | 10.000 comandos/dia; 256MB storage |

> Para uso com amigos ocasional, o plano gratuito é suficiente. Se houver demanda constante, considere o plano pago do Render ($7/mês para evitar sleep).

---

## 11. Troubleshooting

### Problema: Socket.io não conecta
- Verifique se `CORS_ORIGIN` está configurado corretamente.
- Confirme que o frontend usa a URL HTTPS do backend.
- O Render suporta WebSocket no plano Free.

### Problema: Redis atinge limite de comandos (Upstash)
- Upstash Free tem limite de 10.000 comandos/dia.
- Se o jogo ficar muito ativo, considere migrar para Redis Cloud (30MB free) ou upgrade no Upstash.

### Problema: MongoDB connection timeout
- Verifique se o IP `0.0.0.0/0` está liberado no Network Access do Atlas.
- Confirme se a `MONGODB_URI` está correta e completa.

### Problema: Backend não encontra os módulos após build
- Render usa `pnpm` por padrão se detectar `pnpm-lock.yaml`.
- Certifique-se de que o `start command` aponta para `apps/backend/dist/index.js` (ou `dist/index.js` relativo à raiz, dependendo da configuração).

---

## 12. Roadmap Pós-Deploy

- [ ] Configurar domínio personalizado (opcional, gratuito no Render com DNS)
- [ ] Adicionar monitoramento básico (UptimeRobot para evitar sleep)
- [ ] Configurar SSL automático (Render já faz isso)
- [ ] Avaliar upgrade para plano pago se houver uso constante

---

*Documento criado em 2026-05-10 — atualizar conforme mudanças de plataforma.*
