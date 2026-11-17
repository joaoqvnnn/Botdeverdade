import type { NextFunction } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../types';
import { checkAccess } from '../../services/channels';
import { getRendered } from '../../services/messages';
import { editScreen } from '../helpers/screen';
import { prisma } from '../../db/client';

const SKIP_COMMANDS = ['/start', '/cancelar', '/admin'];

export function buildAccessKeyboard(channelLink?: string, groupLink?: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (channelLink) kb.url('📢 Entrar no canal', channelLink).row();
  if (groupLink) kb.url('👥 Entrar no grupo', groupLink);
  return kb;
}

export async function accessGuard(ctx: BotContext, next: NextFunction) {
  if (!ctx.member) return next();

  const text = ctx.message?.text;
  if (text && SKIP_COMMANDS.some((c) => text === c || text.startsWith(c + ' '))) {
    return next();
  }
  if (ctx.member.hasAccess) return next();

  const access = await checkAccess(ctx.api, ctx.member.telegramId);

  if (access.ok) {
    await prisma.member.update({
      where: { id: ctx.member.id },
      data: {
        hasAccess: true,
        joinedChannelAt: access.channel ? new Date() : ctx.member.joinedChannelAt,
        joinedGroupAt: access.group ? new Date() : ctx.member.joinedGroupAt,
      },
    });
    ctx.member.hasAccess = true;
    return next();
  }

  const textBlock = await getRendered(
    'access_restricted',
    {},
    '🔒 ACESSO RESTRITO\n\nPara utilizar nossos serviços, é necessário participar dos nossos espaços oficiais no Telegram.\n\n👇 Escolha os espaços para entrar:'
  );

  await editScreen(ctx, textBlock, {
    keyboard: buildAccessKeyboard(access.channelLink, access.groupLink),
  });
}
