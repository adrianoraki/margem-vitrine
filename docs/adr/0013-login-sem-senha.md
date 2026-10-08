# 0013: Login sem senha com Supabase Auth e sessão em cookie

**Contexto.** A RF-01 pede login por link mágico no e-mail ou pelo Google. O site é Next.js App Router
e precisa saber quem está logado no servidor (middleware, Server Components), não só no navegador.

**Decisão.**

- `@supabase/ssr` com sessão em cookie e fluxo PKCE. O link do e-mail volta para `/auth/callback`,
  que troca o `code` pela sessão e segue para um destino interno (`destinoSeguro` barra open
  redirect).
- O middleware roda só em `/painel/*` e `/entrar`: protege a área logada e renova a sessão. Sem
  cookie de sessão, ele não chama o Supabase. A landing continua estática.
- O botão do Google só aparece se o provedor estiver ativo no Supabase (`/auth/v1/settings`).
- Toda rota de autenticação (`/auth/callback`, `/auth/sair`) passa por `comLimiteDeTaxa`. O teste
  que cobra isso agora varre todo `src/app`.
- `/auth/sair` só aceita POST, para um prefetch ou uma imagem não deslogar ninguém.

**Consequências.**

- O link precisa ser aberto no mesmo navegador em que foi pedido (o verificador PKCE fica no
  cookie). A tela explica isso quando o link falha.
- No Supabase, a Site URL e as Redirect URLs precisam incluir o domínio de produção.
- O SMTP padrão do Supabase só entrega para membros do time e com limite baixo. Antes de abrir
  cadastro ao público, configure SMTP próprio (Resend, previsto na stack).

**Atualização (28/09/2026).** O primeiro teste real mostrou o limite do PKCE: o link foi pedido
no computador e aberto no celular, e a troca falhou por falta do verificador. O link do e-mail
passou a usar `token_hash` (`/auth/confirmar`, validado no servidor com `verifyOtp`), que funciona
em qualquer aparelho. O e-mail também traz um código de 6 dígitos, que pode ser digitado na tela
de login. O PKCE continua só para o Google. Os templates ficam em `supabase/templates/` e precisam
ser colados no painel do projeto remoto.
