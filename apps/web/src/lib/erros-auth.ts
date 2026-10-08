/** Erro do Supabase Auth no formato que importa aqui. */
export interface ErroAuth {
  status?: number;
  code?: string;
  message: string;
}

/**
 * Traduz erro do envio do link para uma mensagem honesta.
 * O Supabase tem dois limites diferentes com o mesmo código `over_email_send_rate_limit`:
 * a espera curta por endereço ("after 30 seconds") e a cota de e-mails por hora do projeto.
 * @param erro Erro devolvido por signInWithOtp.
 */
export function mensagemErroEnvio(erro: ErroAuth): string {
  const espera = erro.message.match(/after (\d+) seconds?/i);
  if (espera) return `Aguarde ${espera[1]} segundos para pedir outro link.`;
  if (erro.code === 'over_email_send_rate_limit' || /email rate limit/i.test(erro.message)) {
    return 'Limite de envio de e-mails atingido no momento. Se já recebeu um código, digite-o abaixo; se não, tente de novo em alguns minutos.';
  }
  if (erro.status === 429) return 'Muitas tentativas seguidas. Tente de novo em instantes.';
  return 'Não conseguimos enviar o link agora. Tente de novo em instantes.';
}
