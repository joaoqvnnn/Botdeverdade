import { bot } from '../index';
import { showMainMenu } from '../screens/main';
import { redirectToSupport } from '../screens/support';

bot.callbackQuery('menu:main', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showMainMenu(ctx);
});

bot.callbackQuery('menu:support', async (ctx) => {
  await redirectToSupport(ctx);
});
