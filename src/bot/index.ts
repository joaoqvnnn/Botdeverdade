import { Bot } from 'grammy';
import { env } from '../config/env';
import { logger } from '../services/logger';
import type { BotContext } from './types';
import { defaultSession } from './types';
import { getMemberByTelegramId } from '../services/members';
import { sessionMiddleware } from './middlewares/session';
import { maintenanceMiddleware } from './middlewares/maintenance';
import { accessGuard } from './middlewares/access';
import { adminMiddleware } from './middlewares/admin';

export const bot = new Bot<BotContext>(env.BOT_TOKEN);

bot.catch((err) => {
  logger.error({ err: err.error, updateId: err.ctx.update.update_id }, 'Bot error');
});

// 1. Identifica o membro pelo telegramId
bot.use(async (ctx, next) => {
  if (ctx.from && !ctx.from.is_bot) {
    const m = await getMemberByTelegramId(String(ctx.from.id));
    ctx.member = m;
    ctx.memberId = m?.id ?? null;
  }
  ctx.session = defaultSession();
  return next();
});

// 2. Admin
bot.use(adminMiddleware);

// 3. Sessão persistida
bot.use(sessionMiddleware);

// 4. Manutenção
bot.use(maintenanceMiddleware);

// 5. Guard de acesso (canal/grupo)
bot.use(accessGuard);

// Carrega comandos e eventos
import './commands/start';
import './commands/cancel';
import './commands/admin';
import './events/chatMember';

bot.command('ping', (ctx) => ctx.reply('🏓 pong'));

bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;
  // M3+ gerencia fluxos aqui
});
