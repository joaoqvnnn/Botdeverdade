import { Bot, session } from 'grammy';
import { env } from '../config/env';
import { logger } from '../services/logger';
import type { BotContext, SessionData } from './types';

export const bot = new Bot<BotContext>(env.BOT_TOKEN);

function initial(): SessionData {
  return {
    screen: 'main',
    previousScreen: null,
    pendingOperation: null,
    catalogPage: 0,
  };
}

bot.use(session({ initial }));

bot.catch((err) => {
  logger.error({ err: err.error, update: err.ctx.update }, 'Bot error');
});

// Placeholder até M3
bot.command('ping', (ctx) => ctx.reply('🏓 pong'));
