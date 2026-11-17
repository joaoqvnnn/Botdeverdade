import { bot } from '../index';
import { requireAdmin } from '../middlewares/admin';
import { env } from '../../config/env';

bot.command('admin', async (ctx) => {
  if (!requireAdmin(ctx)) {
    await ctx.reply('❌ Acesso negado.');
    return;
  }
  await ctx.reply('🐼 Painel Administrativo BELLAMY', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ Abrir Painel Admin', web_app: { url: `${env.WEBHOOK_URL}/admin` } }],
      ],
    },
  });
});
