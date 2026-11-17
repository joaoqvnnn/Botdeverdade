import type { BotContext } from '../types';
import { editScreen } from '../helpers/screen';
import { buildMainMenuKeyboard, welcomeScreenData } from '../helpers/menu';

export async function showMainMenu(ctx: BotContext) {
  if (!ctx.member || !ctx.from) return;
  const text = await welcomeScreenData(ctx.member.id, ctx.from);
  const kb = await buildMainMenuKeyboard(ctx.member.id);
  ctx.session.screen = 'main';
  ctx.session.previousScreen = null;
  await editScreen(ctx, text, { keyboard: kb });
}
