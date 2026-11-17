import { bot } from '../index';
import { ensureMember } from '../../services/members';
import { checkAccess, getRequiredChannels } from '../../services/channels';
import { getRendered } from '../../services/messages';
import { sendScreen, editScreen } from '../helpers/screen';
import { buildAccessKeyboard } from '../middlewares/access';
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

    await sendScreen(ctx, text, { keyboard: buildAccessKeyboard(channelLink, groupLink) });
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

  const hour = new Date().getHours();
  const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const wallet = await prisma.wallet.findUnique({ where: { memberId: member.id } });
  const saldo = wallet ? Number(wallet.balance).toFixed(2).replace('.', ',') : '0,00';

  const text = await getRendered(
    'welcome',
    {
      saudacao,
      nome_bot: 'BELLAMY',
      username: from.username ? `@${from.username}` : from.first_name || 'membro',
      user_id: from.id,
      saldo,
    },
    `🌤️ ${saudacao}, BELLAMY!\n\n🐼 Seja muito bem-vindo(a) à nossa loja!\n\n👇 Comece agora e aproveite nossos serviços!\n\nℹ️ SEU PERFIL\n➩ Usuário: @${from.username || from.first_name}\n➩ ID: ${from.id}\n➩ Saldo: R$ ${saldo}`
  );

  await editScreen(ctx, text);
});
