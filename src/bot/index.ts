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

bot.use(async (ctx, next) => {
  if (ctx.from && !ctx.from.is_bot) {
    const m = await getMemberByTelegramId(String(ctx.from.id));
    ctx.member = m;
    ctx.memberId = m?.id ?? null;
  }
  ctx.session = defaultSession();
  return next();
});

bot.use(adminMiddleware);
bot.use(sessionMiddleware);
bot.use(maintenanceMiddleware);
bot.use(accessGuard);

import './commands/start';
import './commands/cancel';
import './commands/admin';
import './events/chatMember';
import './callbacks/menu';

bot.command('ping', (ctx) => ctx.reply('🏓 pong'));

bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;
  // fluxos de reply das próximas seções
});
