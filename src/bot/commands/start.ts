import { bot } from '../index';
import { ensureMember } from '../../services/members';
import { checkAccess, getRequiredChannels } from '../../services/channels';
import { getRendered } from '../../services/messages';
import { sendScreen } from '../helpers/screen';
import { buildAccessKeyboard } from '../middlewares/access';
import { buildMainMenuKeyboard, welcomeScreenData } from '../helpers/menu';
import { prisma } from '../../db/client';

bot.command('start', async (ctx) => {
  const payload = typeof ctx.match === 'string' ? ctx.match.trim() : '';
  if (payload) ctx.session.startPayload = payload;

  const from = ctx.from;
  if (!from) return;

  const member = await ensureMember(from);
  ctx.member = member;
  ctx.memberId = member.id;

  const access = await checkAccess(ctx.api, member.telegramId);

  if (!access.ok) {
    const { channel, group } = await getRequiredChannels();
    const channelLink = channel?.inviteLink || access.channelLink;
    const groupLink = group?.inviteLink || access.groupLink;

    const text = await getRendered(
      'access_restricted',
      {},
      '🔒 ACESSO RESTRITO\n\nPara utilizar nossos serviços, é necessário participar dos nossos espaços oficiais no Telegram.\n\nEntre nos dois espaços abaixo para liberar seu acesso:\n\n👇 Escolha os espaços para entrar:'
    );

    const sent = await sendScreen(ctx, text, {
      keyboard: buildAccessKeyboard(channelLink, groupLink),
    });
    ctx.session.mainMessageId = sent.message_id;
    return;
  }

  await prisma.member.update({
    where: { id: member.id },
    data: {
      hasAccess: true,
      joinedChannelAt: member.joinedChannelAt ?? new Date(),
      joinedGroupAt: member.joinedGroupAt ?? new Date(),
    },
  });
  ctx.member = { ...member, hasAccess: true };

  const text = await welcomeScreenData(member.id, from);
  const kb = await buildMainMenuKeyboard(member.id);
  const sent = await sendScreen(ctx, text, { keyboard: kb });
  ctx.session.mainMessageId = sent.message_id;
  ctx.session.screen = 'main';
});
