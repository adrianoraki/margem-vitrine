'use client';

import { Botao, Entrada } from '@margem/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { supabaseNavegador } from '@/lib/supabase-navegador';

/**
 * Envio do certificado A1 direto do navegador para a Edge Function certificado-upload
 * (docs/adr/0005): o site nunca recebe, guarda ou lê de volta o arquivo e a senha.
 */
export function EnviarCertificado({ organizacao }: { organizacao: string }) {
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // depois do await o evento sintético não tem mais currentTarget
    const dados = new FormData(form);
    const arquivo = dados.get('certificado');
    if (!(arquivo instanceof File) || arquivo.size === 0)
      return setErro('Escolha o arquivo .pfx ou .p12.');
    if (!dados.get('senha')) return setErro('Digite a senha do certificado.');
    dados.set('organizacao_id', organizacao);
    setErro(undefined);
    setEnviando(true);
    const { error } = await supabaseNavegador().functions.invoke('certificado-upload', {
      body: dados,
    });
    setEnviando(false);
    form.reset();
    if (error) {
      let msg = 'Não foi possível enviar o certificado. Tente de novo.';
      try {
        const corpo = (await (error as { context?: Response }).context?.json()) as
          { erro?: string } | undefined;
        if (corpo?.erro) msg = corpo.erro;
      } catch {
        // resposta sem JSON: fica a mensagem padrão
      }
      return setErro(msg);
    }
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void aoEnviar(e)} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <label htmlFor="certificado" className="text-small font-medium">
          Arquivo do certificado A1 (.pfx ou .p12)
        </label>
        <input
          id="certificado"
          name="certificado"
          type="file"
          accept=".pfx,.p12,application/x-pkcs12"
          disabled={enviando}
          className="text-small file:rounded-botao file:border-border file:bg-surface file:text-small file:mr-3 file:border file:px-3 file:py-2"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="senha" className="text-small font-medium">
          Senha do certificado
        </label>
        <Entrada id="senha" name="senha" type="password" autoComplete="off" disabled={enviando} />
      </div>
      {erro && (
        <p role="alert" className="text-small text-critical">
          {erro}
        </p>
      )}
      <Botao type="submit" className="justify-self-start" disabled={enviando}>
        {enviando ? 'Validando…' : 'Enviar certificado'}
      </Botao>
      <p className="text-caption text-text-secondary">
        O arquivo e a senha vão direto para o cofre criptografado (Supabase Vault). Você pode
        revogar a qualquer momento.
      </p>
    </form>
  );
}
