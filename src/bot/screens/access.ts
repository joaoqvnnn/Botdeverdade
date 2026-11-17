import type { BotContext } from '../types';
import { InlineKeyboard } from 'grammy';
import { editScreen } from '../helpers/screen';
import { getRendered } from '../../services/messages';
import { getRequiredChannels } from '../../services/channels';

export async function showAccessBlocked(ctx: BotContext) {
  const { channel, group } = await getRequiredChannels();
  const kb = new InlineKeyboard();
  if (channel?.inviteLink) kb.url('📢 Entrar no canal', channel.inviteLink).row();
  if (group?.inviteLink) kb.url('👥 Entrar no grupo', group.inviteLink);

  const text = await getRendered(
    'access_restricted',
    {},
    '🔒 ACESSO RESTRITO\n\nPara utilizar nossos serviços, é necessário participar dos nossos espaços oficiais no Telegram.\n\nEntre nos dois espaços abaixo para liberar seu acesso:\n\n👇 Escolha os espaços para entrar:'
  );
  await editScreen(ctx, text, { keyboard: kb });
}
