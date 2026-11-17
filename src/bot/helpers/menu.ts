import { InlineKeyboard } from 'grammy';
import { prisma } from '../../db/client';
import { renderWithKeyboard } from '../../services/messages';

export async function buildMainMenuKeyboard(memberId: string): Promise<InlineKeyboard> {
  const cart = await prisma.cart.findUnique({
    where: { memberId },
    include: { items: true },
  });
  const cartQty = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const kb = new InlineKeyboard()
    .text('🎟️ Logins | Contas Premium', 'menu:catalog').row()
    .text('👤 Perfil', 'menu:profile').row()
    .text('💰 Adicionar saldo', 'menu:recharge').row()
    .text('🏆 Ranking', 'menu:ranking').row()
    .text('💎 Indicação', 'menu:referral').row()
    .text('🆘 Atendimento', 'menu:support').row();

  if (cartQty > 0) {
    kb.text(`🛒 Carrinho (${cartQty})`, 'menu:cart');
  }
  return kb;
}

export async function welcomeScreenData(memberId: string, tg: { id: number; username?: string; first_name?: string }) {
  const hour = new Date().getHours();
  const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const wallet = await prisma.wallet.findUnique({ where: { memberId } });
  const saldo = wallet ? Number(wallet.balance).toFixed(2).replace('.', ',') : '0,00';

  const vars = {
    saudacao,
    nome_bot: 'BELLAMY',
    username: tg.username ? `@${tg.username}` : tg.first_name || 'membro',
    user_id: tg.id,
    saldo,
  };

  const fallback = `🌤️ ${saudacao}, BELLAMY!

🐼 Seja muito bem-vindo(a) à nossa loja!

Descubra uma maneira simples e prática de realizar suas compras diretamente pelo Telegram.

👨‍💻 Sistema automatizado para facilitar seus pedidos.

💠 Recargas de saldo de forma rápida.

🛒 Produtos e serviços disponíveis em nosso catálogo.

Navegue pelo menu e encontre o que procura em poucos cliques!

❗️ INFORMAÇÕES IMPORTANTES

Antes de adicionar saldo, confira a disponibilidade dos produtos desejados.

Não realizamos reembolsos em dinheiro. Eventuais problemas serão tratados conforme nossa política de atendimento, com a devida análise.

👇 Comece agora e aproveite nossos serviços!

ℹ️ SEU PERFIL

➩ Usuário: ${vars.username}
➩ ID: ${vars.user_id}
➩ Saldo: R$ ${saldo}`;

  const { text } = await renderWithKeyboard('welcome', vars, fallback);
  return text;
}
