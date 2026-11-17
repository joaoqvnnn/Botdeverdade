import type { BotContext } from '../types';
import { prisma } from '../../db/client';
import { getSetting } from '../../services/settings';

export async function redirectToSupport(ctx: BotContext): Promise<void> {
  if (!ctx.member || !ctx.from) return;

  const usernameCfg = await getSetting<string>('support_username', '');
  let supportUsername = usernameCfg;

  if (!supportUsername) {
    const ch = await prisma.channelConfig.findUnique({ where: { purpose: 'SUPPORT_CHAT' } });
    supportUsername = ch?.inviteLink?.replace('https://t.me/', '').replace('@', '') || '';
  }

  if (!supportUsername) {
    await ctx.answerCallbackQuery({
      text: 'Atendimento indisponível no momento.',
      show_alert: true,
    });
    return;
  }

  const msg = encodeURIComponent(
    `Olá, preciso de atendimento. Meu ID: ${ctx.from.id}`
  );
  const url = `https://t.me/${supportUsername}?text=${msg}`;

  await ctx.answerCallbackQuery({ url });
}
