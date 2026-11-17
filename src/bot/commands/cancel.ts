import { bot } from '../index';
import { clearReplyChain } from '../helpers/screen';

bot.command('cancelar', async (ctx) => {
  const hadPending = !!ctx.session.pendingOperation;

  ctx.session.pendingOperation = null;
  ctx.session.pendingData = {};
  ctx.session.productId = null;
  ctx.session.quantity = null;
  clearReplyChain(ctx);

  const msg = hadPending
    ? '❌ OPERAÇÃO CANCELADA!\n\nA operação foi encerrada com sucesso.\n\nVocê poderá iniciar uma nova operação quando desejar.'
    : 'ℹ️ Nenhuma operação em andamento.';

  await ctx.reply(msg);
});
