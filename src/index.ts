import express from 'express';
import { webhookCallback } from 'grammy';
import path from 'path';
import { env } from './config/env';
import { logger } from './services/logger';
import { bot } from './bot';
import { prisma } from './db/client';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (Render usa para monitorar)
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

// Webhook do Telegram
app.post(
  `/webhook/${env.WEBHOOK_SECRET}`,
  webhookCallback(bot, 'express', {
    secretToken: env.WEBHOOK_SECRET,
    timeoutMilliseconds: 30_000,
  }),
);

// Webhook do PIX — implementado no módulo de pagamento
app.post('/webhook/pix', (_req, res) => {
  logger.info('PIX webhook recebido (placeholder)');
  res.sendStatus(200);
});

// Mini App do admin (será preenchido no M16)
app.use('/admin', express.static(path.join(process.cwd(), 'public/admin')));

async function bootstrap() {
  await prisma.$connect();
  logger.info('✅ PostgreSQL conectado');

  await bot.api.setWebhook(`${env.WEBHOOK_URL}/webhook/${env.WEBHOOK_SECRET}`, {
    secret_token: env.WEBHOOK_SECRET,
    allowed_updates: [
      'message',
      'callback_query',
      'chat_member',
      'my_chat_member',
      'inline_query',
      'pre_checkout_query',
    ],
    drop_pending_updates: false,
  });
  logger.info(`✅ Webhook: ${env.WEBHOOK_URL}/webhook/${env.WEBHOOK_SECRET}`);

  const me = await bot.api.getMe();
  logger.info(`✅ Bot online: @${me.username} (${me.id})`);

  app.listen(env.PORT, () => logger.info(`✅ Servidor na porta ${env.PORT}`));
}

bootstrap().catch((err) => {
  logger.error({ err }, '❌ Falha ao iniciar');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando...');
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
