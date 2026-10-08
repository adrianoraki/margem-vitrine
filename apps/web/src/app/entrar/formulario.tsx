'use client';

import { Botao, Entrada } from '@margem/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { mensagemErroEnvio } from '@/lib/erros-auth';
import { supabaseNavegador } from '@/lib/supabase-navegador';

const emailSchema = z.email('Digite um e-mail válido, como voce@empresa.com.br');
// O Supabase gera códigos de 6 dígitos (8 em projetos novos): aceita os dois.
const codigoSchema = z.string().regex(/^\d{6,8}$/, 'Digite o código de 6 dígitos do e-mail.');

type Estado =
  | { etapa: 'formulario'; erro?: string }
  | { etapa: 'enviando' }
  | { etapa: 'enviado'; email: string; aviso?: string };

const ESPERA_REENVIO = 60; // o Supabase exige ao menos 30 s entre e-mails para o mesmo endereço

interface Props {
  destino: string;
  google: boolean;
  erroInicial?: string;
}

/** Login sem senha (RF-01): link mágico por e-mail ou Google. */
export function FormularioEntrar({ destino, google, erroInicial }: Props) {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<Estado>({ etapa: 'formulario', erro: erroInicial });
  const [espera, setEspera] = useState(0);
  const [codigo, setCodigo] = useState('');
  const [erroCodigo, setErroCodigo] = useState<string>();
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  // Volta do Google (OAuth/PKCE). O link do e-mail usa /auth/confirmar, definido no template do Supabase.
  const retorno = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`;

  async function enviarLink(alvo: string) {
    setEstado({ etapa: 'enviando' });
    const { error } = await supabaseNavegador().auth.signInWithOtp({
      email: alvo,
      options: { emailRedirectTo: retorno(), shouldCreateUser: true },
    });
    if (error) {
      setEstado({ etapa: 'formulario', erro: mensagemErroEnvio(error) });
      return;
    }
    setEstado({ etapa: 'enviado', email: alvo });
    setEspera(ESPERA_REENVIO);
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    const r = emailSchema.safeParse(email.trim().toLowerCase());
    if (!r.success) {
      setEstado({ etapa: 'formulario', erro: r.error.issues[0]?.message });
      return;
    }
    void enviarLink(r.data);
  }

  /** Código de 6 dígitos do e-mail: entra neste aparelho, mesmo lendo o e-mail em outro. */
  async function verificarCodigo(e: FormEvent, alvo: string) {
    e.preventDefault();
    const r = codigoSchema.safeParse(codigo.replace(/\s/g, ''));
    if (!r.success) {
      setErroCodigo(r.error.issues[0]?.message);
      return;
    }
    setVerificando(true);
    setErroCodigo(undefined);
    const { error } = await supabaseNavegador().auth.verifyOtp({
      email: alvo,
      token: r.data,
      type: 'email',
    });
    if (error) {
      setVerificando(false);
      setErroCodigo('Código inválido ou vencido. Confira o último e-mail recebido.');
      return;
    }
    // Navegação completa: o middleware e o servidor passam a enxergar o cookie da sessão.
    window.location.assign(destino);
  }

  /** Quem já recebeu um código (ex.: limite de envio atingido) pula direto para digitá-lo. */
  function jaTenhoCodigo() {
    const r = emailSchema.safeParse(email.trim().toLowerCase());
    if (!r.success) {
      setEstado({ etapa: 'formulario', erro: 'Digite primeiro o e-mail em que recebeu o código.' });
      return;
    }
    setEstado({ etapa: 'enviado', email: r.data });
  }

  async function entrarComGoogle() {
    await supabaseNavegador().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: retorno() },
    });
  }

  if (estado.etapa === 'enviado') {
    return (
      <div className="animate-entrar" role="status" aria-live="polite">
        <div className="rounded-card bg-accent-soft text-accent flex size-12 items-center justify-center">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16v12H4z" strokeLinejoin="round" />
            <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-h2 mt-5 font-semibold">Confira seu e-mail</h2>
        <p className="text-body text-text-secondary mt-2">
          Enviamos um link de acesso para{' '}
          <strong className="text-text-primary">{estado.email}</strong>. Clique no link, em qualquer
          aparelho, ou digite aqui o código que veio junto.
        </p>
        <form
          onSubmit={(e) => void verificarCodigo(e, estado.email)}
          noValidate
          className="mt-6 grid gap-3"
        >
          <label htmlFor="codigo" className="text-small font-medium">
            Código de acesso
          </label>
          <Entrada
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={8}
            className="numeros font-titulo text-h3 text-center tracking-[0.4em]"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            invalido={Boolean(erroCodigo)}
            aria-describedby={erroCodigo ? 'codigo-erro' : undefined}
            disabled={verificando}
          />
          {erroCodigo && (
            <p id="codigo-erro" role="alert" className="text-small text-critical">
              {erroCodigo}
            </p>
          )}
          <Botao type="submit" className="h-12 w-full md:h-12" disabled={verificando}>
            {verificando ? 'Entrando…' : 'Entrar com o código'}
          </Botao>
        </form>
        <div className="mt-6 flex flex-wrap gap-3">
          <Botao
            variante="secundario"
            disabled={espera > 0}
            onClick={() => void enviarLink(estado.email)}
          >
            {espera > 0 ? `Reenviar em ${espera}s` : 'Reenviar link'}
          </Botao>
          <Botao variante="texto" onClick={() => setEstado({ etapa: 'formulario' })}>
            Usar outro e-mail
          </Botao>
        </div>
        <p className="text-caption text-text-secondary mt-6">
          Não chegou? Olhe a caixa de spam ou promoções.
        </p>
      </div>
    );
  }

  const enviando = estado.etapa === 'enviando';
  const erro = estado.etapa === 'formulario' ? estado.erro : undefined;

  return (
    <div>
      <form onSubmit={aoEnviar} noValidate className="grid gap-3">
        <label htmlFor="email" className="text-small font-medium">
          E-mail de trabalho
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="text-text-secondary pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          >
            <path d="M4 6h16v12H4z" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <Entrada
            className="pl-11"
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalido={Boolean(erro)}
            aria-describedby={erro ? 'email-erro' : undefined}
            disabled={enviando}
          />
        </div>
        {erro && (
          <p id="email-erro" role="alert" className="text-small text-critical">
            {erro}
          </p>
        )}
        {erro?.startsWith('Limite de envio') && (
          <Botao
            type="button"
            variante="texto"
            className="justify-start px-0"
            onClick={jaTenhoCodigo}
          >
            Já tenho um código →
          </Botao>
        )}
        <Botao type="submit" className="mt-1 h-12 w-full md:h-12" disabled={enviando}>
          {enviando ? (
            <>
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              />
              Enviando…
            </>
          ) : (
            'Receber link de acesso'
          )}
        </Botao>
      </form>

      {google && (
        <>
          <div className="text-caption text-text-secondary my-6 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            ou
            <span className="bg-border h-px flex-1" />
          </div>
          <Botao
            variante="secundario"
            className="w-full"
            onClick={() => void entrarComGoogle()}
            disabled={enviando}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"
              />
            </svg>
            Continuar com Google
          </Botao>
        </>
      )}
    </div>
  );
}
