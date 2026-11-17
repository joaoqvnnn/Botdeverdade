# BELLAMY Bot

Bot completo da loja BELLAMY (painel membro + painel admin via Telegram Mini App).

## Stack
- Node.js 20 + TypeScript
- grammY (Telegram Bot API)
- PostgreSQL (Prisma)
- Redis + BullMQ (filas)
- Express (webhook + Mini App)
- Deploy: Render (Web Service + PostgreSQL + Redis)

## Setup local
1. `npm install`
2. `cp .env.example .env` e preencher
3. `npx prisma generate`
4. `npm run dev`
5. Abrir um túnel (ngrok) e configurar `WEBHOOK_URL`

## Deploy no Render
1. Subir repositório no GitHub
2. Render → New → Blueprint → selecionar `render.yaml`
3. Preencher as variáveis `sync: false` no dashboard
4. Render fará `npm ci && prisma generate && tsc` no build
5. No start: `prisma migrate deploy && node dist/index.js`
