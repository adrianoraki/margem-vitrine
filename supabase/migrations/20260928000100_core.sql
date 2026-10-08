-- Margem — esquema core: organização, membros, assinatura, notificações, jobs e limite de taxa.
-- Regra do repositório: TODA tabela nasce com RLS ativada, sem exceção.
-- supabase/tests/rls_test.sql falha o CI se alguma tabela de core/licita/compras ficar sem RLS.

create schema if not exists core;
create schema if not exists licita;
create schema if not exists compras;

grant usage on schema core, licita, compras to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type core.papel as enum ('dono', 'membro');
create type core.plano as enum ('free', 'licita_pro', 'compras_pro', 'completo');
create type core.status_assinatura as enum ('teste', 'ativa', 'inadimplente', 'cancelada');

-- ---------------------------------------------------------------------------
-- Organizações (um CNPJ por organização no MVP — RF-01)
-- ---------------------------------------------------------------------------
create table core.organizacoes (
  id uuid primary key default gen_random_uuid(),
  -- CNPJ fica nulo só depois da exclusão da conta (docs/politica-retencao-dados.md).
  cnpj text unique check (cnpj ~ '^[0-9]{14}$'),
  razao_social text not null,
  nome_fantasia text,
  cnae_principal text,
  uf char(2),
  municipio text,
  criado_em timestamptz not null default now(),
  exclusao_solicitada_em timestamptz,
  constraint organizacao_com_cnpj check (cnpj is not null or exclusao_solicitada_em is not null)
);
alter table core.organizacoes enable row level security;

create table core.membros (
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  papel core.papel not null default 'membro',
  criado_em timestamptz not null default now(),
  primary key (organizacao_id, user_id)
);
alter table core.membros enable row level security;
create index membros_user_idx on core.membros (user_id);

-- Funções de pertencimento. SECURITY DEFINER para ler core.membros sem cair na
-- própria política de core.membros (recursão). search_path vazio: tudo qualificado.
create function core.eh_membro(p_organizacao uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from core.membros m
    where m.organizacao_id = p_organizacao and m.user_id = auth.uid()
  );
$$;

create function core.eh_dono(p_organizacao uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from core.membros m
    where m.organizacao_id = p_organizacao and m.user_id = auth.uid() and m.papel = 'dono'
  );
$$;

revoke all on function core.eh_membro(uuid), core.eh_dono(uuid) from public;
grant execute on function core.eh_membro(uuid), core.eh_dono(uuid) to authenticated, service_role;

create policy organizacoes_select_membro on core.organizacoes
  for select to authenticated using (core.eh_membro(id));
create policy organizacoes_update_dono on core.organizacoes
  for update to authenticated using (core.eh_dono(id)) with check (core.eh_dono(id));

create policy membros_select_mesma_org on core.membros
  for select to authenticated using (core.eh_membro(organizacao_id));
create policy membros_insert_dono on core.membros
  for insert to authenticated with check (core.eh_dono(organizacao_id) and papel = 'membro');
create policy membros_delete_dono on core.membros
  for delete to authenticated using (core.eh_dono(organizacao_id) and user_id <> auth.uid());

-- ---------------------------------------------------------------------------
-- Assinaturas — só o dono vê cobrança (RF-03). Escrita só pelo servidor (webhook do gateway).
-- ---------------------------------------------------------------------------
create table core.assinaturas (
  organizacao_id uuid primary key references core.organizacoes (id) on delete cascade,
  plano core.plano not null default 'free',
  status core.status_assinatura not null default 'ativa',
  teste_ate timestamptz,
  gateway_cliente_id text,
  atualizado_em timestamptz not null default now()
);
alter table core.assinaturas enable row level security;
create policy assinaturas_select_dono on core.assinaturas
  for select to authenticated using (core.eh_dono(organizacao_id));

-- ---------------------------------------------------------------------------
-- Notificações (RF-04) — uma linha por usuário, estado de lida sincroniza via Realtime.
-- ---------------------------------------------------------------------------
create table core.notificacoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  corpo text,
  link text,
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);
alter table core.notificacoes enable row level security;
create index notificacoes_user_idx on core.notificacoes (user_id, criado_em desc);
create policy notificacoes_select_propria on core.notificacoes
  for select to authenticated using (user_id = auth.uid() and core.eh_membro(organizacao_id));
create policy notificacoes_update_propria on core.notificacoes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table core.dispositivos_push (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  plataforma text not null check (plataforma in ('web', 'ios', 'android')),
  endpoint text not null unique,
  chaves jsonb,
  criado_em timestamptz not null default now()
);
alter table core.dispositivos_push enable row level security;
create policy dispositivos_push_proprio on core.dispositivos_push
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and core.eh_membro(organizacao_id));

-- ---------------------------------------------------------------------------
-- Pedidos do titular (LGPD) — registro de que o pedido existiu e quando foi atendido.
-- ---------------------------------------------------------------------------
create table core.solicitacoes_titular (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  tipo text not null check (tipo in ('exportacao', 'exclusao', 'correcao')),
  solicitado_por uuid references auth.users (id) on delete set null,
  solicitado_em timestamptz not null default now(),
  concluido_em timestamptz,
  detalhes jsonb not null default '{}'::jsonb
);
alter table core.solicitacoes_titular enable row level security;
create policy solicitacoes_titular_select_dono on core.solicitacoes_titular
  for select to authenticated using (core.eh_dono(organizacao_id));

-- ---------------------------------------------------------------------------
-- Log de jobs (coletor PNCP, importador DF-e). Sem política: só service_role lê e escreve.
-- O keep-alive lê esta tabela a cada 3 dias.
-- ---------------------------------------------------------------------------
create table core.log_jobs (
  id bigint generated always as identity primary key,
  job text not null,
  iniciado_em timestamptz not null default now(),
  terminado_em timestamptz,
  status text not null default 'rodando' check (status in ('rodando', 'ok', 'erro')),
  detalhes jsonb not null default '{}'::jsonb
);
alter table core.log_jobs enable row level security;
create index log_jobs_job_idx on core.log_jobs (job, iniciado_em desc);

-- ---------------------------------------------------------------------------
-- Limite de taxa para rotas de API públicas. A chave já chega com hash (nunca IP cru).
-- ---------------------------------------------------------------------------
create table core.limites_taxa (
  chave text not null,
  janela timestamptz not null,
  contagem integer not null default 0,
  primary key (chave, janela)
);
alter table core.limites_taxa enable row level security;

/**
 * Conta uma requisição e diz se ela cabe no limite.
 * Janela fixa de p_janela_segundos. Retorna true se permitido.
 */
create function core.consumir_limite(p_chave text, p_limite integer, p_janela_segundos integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_janela timestamptz;
  v_contagem integer;
begin
  if p_chave is null or length(p_chave) < 16 or length(p_chave) > 128 then
    raise exception 'chave de limite inválida';
  end if;
  if p_limite < 1 or p_limite > 10000 or p_janela_segundos < 1 or p_janela_segundos > 86400 then
    raise exception 'parâmetros de limite fora da faixa';
  end if;

  v_janela := to_timestamp(floor(extract(epoch from now()) / p_janela_segundos) * p_janela_segundos);

  insert into core.limites_taxa as l (chave, janela, contagem)
  values (p_chave, v_janela, 1)
  on conflict (chave, janela) do update set contagem = l.contagem + 1
  returning l.contagem into v_contagem;

  -- Faxina barata: janelas velhas desta mesma chave.
  delete from core.limites_taxa where chave = p_chave and janela < now() - interval '1 day';

  return v_contagem <= p_limite;
end;
$$;
revoke all on function core.consumir_limite(text, integer, integer) from public;
grant execute on function core.consumir_limite(text, integer, integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Criação de organização no onboarding: cria org + dono + assinatura free numa transação.
-- ---------------------------------------------------------------------------
create function core.criar_organizacao(
  p_cnpj text,
  p_razao_social text,
  p_nome_fantasia text default null,
  p_cnae_principal text default null,
  p_uf char(2) default null,
  p_municipio text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;

  insert into core.organizacoes (cnpj, razao_social, nome_fantasia, cnae_principal, uf, municipio)
  values (p_cnpj, p_razao_social, p_nome_fantasia, p_cnae_principal, p_uf, p_municipio)
  returning id into v_id;

  insert into core.membros (organizacao_id, user_id, papel) values (v_id, auth.uid(), 'dono');
  insert into core.assinaturas (organizacao_id, plano, status) values (v_id, 'free', 'ativa');

  return v_id;
end;
$$;
revoke all on function core.criar_organizacao(text, text, text, text, char, text) from public;
grant execute on function core.criar_organizacao(text, text, text, text, char, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Privilégios de tabela. RLS decide as linhas; o GRANT decide se a porta existe.
-- ---------------------------------------------------------------------------
grant select, update on core.organizacoes to authenticated;
grant select, insert, delete on core.membros to authenticated;
grant select on core.assinaturas to authenticated;
grant select on core.notificacoes to authenticated;
grant update (lida_em) on core.notificacoes to authenticated;
grant select, insert, update, delete on core.dispositivos_push to authenticated;
grant select on core.solicitacoes_titular to authenticated;
-- log_jobs e limites_taxa: nenhum grant para anon/authenticated.

grant all on all tables in schema core to service_role;
grant all on all sequences in schema core to service_role;
