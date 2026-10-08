-- Margem Compras — tudo privado por organização.
-- Certificado A1: arquivo e senha no Supabase Vault. A tabela guarda só metadados e o id
-- do segredo, e esses ids nem sequer têm GRANT para o papel authenticated.

-- ---------------------------------------------------------------------------
-- Certificados
-- ---------------------------------------------------------------------------
create table compras.certificados (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  titular_nome text not null,
  tipo text not null check (tipo in ('e-CNPJ', 'e-CPF')),
  valido_de timestamptz not null,
  valido_ate timestamptz not null,
  pfx_secret_id uuid,
  senha_secret_id uuid,
  enviado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  revogado_em timestamptz
);
alter table compras.certificados enable row level security;
create unique index certificados_um_ativo_por_org on compras.certificados (organizacao_id) where revogado_em is null;

create policy certificados_select_org on compras.certificados
  for select to authenticated using (core.eh_membro(organizacao_id));

-- Privilégio por coluna: os ids do cofre ficam de fora.
grant select (id, organizacao_id, cnpj, titular_nome, tipo, valido_de, valido_ate, enviado_por, criado_em, revogado_em)
  on compras.certificados to authenticated;

-- Auditoria de todo acesso ao segredo (quem, quando, para quê).
create table compras.acessos_certificado (
  id bigint generated always as identity primary key,
  certificado_id uuid references compras.certificados (id) on delete set null,
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  acao text not null check (acao in ('upload', 'leitura', 'revogacao')),
  por text not null,
  em timestamptz not null default now()
);
alter table compras.acessos_certificado enable row level security;
create policy acessos_certificado_select_dono on compras.acessos_certificado
  for select to authenticated using (core.eh_dono(organizacao_id));
grant select on compras.acessos_certificado to authenticated;

/**
 * Guarda o certificado no Vault. Só a Edge Function certificado-upload chama (service_role).
 * Revoga o certificado anterior da organização, se houver.
 */
create function compras.salvar_certificado(
  p_organizacao uuid,
  p_cnpj text,
  p_titular text,
  p_tipo text,
  p_valido_de timestamptz,
  p_valido_ate timestamptz,
  p_pfx_base64 text,
  p_senha text,
  p_enviado_por uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_pfx uuid;
  v_senha uuid;
  v_antigo record;
begin
  for v_antigo in
    select id, pfx_secret_id, senha_secret_id from compras.certificados
    where organizacao_id = p_organizacao and revogado_em is null
  loop
    delete from vault.secrets where id in (v_antigo.pfx_secret_id, v_antigo.senha_secret_id);
    update compras.certificados
      set revogado_em = now(), pfx_secret_id = null, senha_secret_id = null
      where id = v_antigo.id;
    insert into compras.acessos_certificado (certificado_id, organizacao_id, acao, por)
      values (v_antigo.id, p_organizacao, 'revogacao', 'substituicao');
  end loop;

  v_pfx := vault.create_secret(p_pfx_base64, 'cert-pfx-' || v_id::text, 'Certificado A1 (pfx, base64)');
  v_senha := vault.create_secret(p_senha, 'cert-senha-' || v_id::text, 'Senha do certificado A1');

  insert into compras.certificados
    (id, organizacao_id, cnpj, titular_nome, tipo, valido_de, valido_ate, pfx_secret_id, senha_secret_id, enviado_por)
  values
    (v_id, p_organizacao, p_cnpj, p_titular, p_tipo, p_valido_de, p_valido_ate, v_pfx, v_senha, p_enviado_por);

  insert into compras.acessos_certificado (certificado_id, organizacao_id, acao, por)
    values (v_id, p_organizacao, 'upload', coalesce(p_enviado_por::text, 'servidor'));

  return v_id;
end;
$$;

/**
 * Lê o certificado decifrado. Só o importador DF-e (service_role) chama; cada leitura fica auditada.
 */
create function compras.ler_certificado(p_certificado uuid, p_por text)
returns table (pfx_base64 text, senha text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cert compras.certificados;
begin
  select * into v_cert from compras.certificados where id = p_certificado and revogado_em is null;
  if not found then
    raise exception 'certificado inexistente ou revogado';
  end if;

  insert into compras.acessos_certificado (certificado_id, organizacao_id, acao, por)
    values (v_cert.id, v_cert.organizacao_id, 'leitura', p_por);

  return query
    select
      (select ds.decrypted_secret from vault.decrypted_secrets ds where ds.id = v_cert.pfx_secret_id),
      (select ds.decrypted_secret from vault.decrypted_secrets ds where ds.id = v_cert.senha_secret_id);
end;
$$;

/**
 * Revogação pelo cliente, a qualquer momento (docs/lgpd.md). Só o dono. Apaga os segredos do Vault.
 */
create function compras.revogar_certificado(p_certificado uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cert compras.certificados;
begin
  select * into v_cert from compras.certificados where id = p_certificado;
  if not found or not core.eh_dono(v_cert.organizacao_id) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  delete from vault.secrets where id in (v_cert.pfx_secret_id, v_cert.senha_secret_id);
  update compras.certificados
    set revogado_em = coalesce(revogado_em, now()), pfx_secret_id = null, senha_secret_id = null
    where id = v_cert.id;
  insert into compras.acessos_certificado (certificado_id, organizacao_id, acao, por)
    values (v_cert.id, v_cert.organizacao_id, 'revogacao', auth.uid()::text);
end;
$$;

revoke all on function compras.salvar_certificado(uuid, text, text, text, timestamptz, timestamptz, text, text, uuid) from public;
revoke all on function compras.ler_certificado(uuid, text) from public;
revoke all on function compras.revogar_certificado(uuid) from public;
grant execute on function compras.salvar_certificado(uuid, text, text, text, timestamptz, timestamptz, text, text, uuid) to service_role;
grant execute on function compras.ler_certificado(uuid, text) to service_role;
grant execute on function compras.revogar_certificado(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Sincronização DF-e (RF-21, RN-04)
-- ---------------------------------------------------------------------------
create table compras.sync_dfe (
  organizacao_id uuid primary key references core.organizacoes (id) on delete cascade,
  cnpj text not null,
  ultimo_nsu bigint not null default 0,
  max_nsu bigint,
  ultima_consulta_em timestamptz,
  -- RN-04: sem documento novo, próxima consulta só depois de 1 hora.
  proxima_consulta_apos timestamptz,
  status text not null default 'aguardando' check (status in ('aguardando', 'importando', 'pausado', 'erro')),
  mensagem text
);
alter table compras.sync_dfe enable row level security;
create policy sync_dfe_select_org on compras.sync_dfe
  for select to authenticated using (core.eh_membro(organizacao_id));

-- ---------------------------------------------------------------------------
-- Fornecedores, produtos, notas, itens
-- ---------------------------------------------------------------------------
create table compras.fornecedores (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  documento text,
  nome text not null,
  uf char(2),
  unique (organizacao_id, documento)
);
alter table compras.fornecedores enable row level security;

create table compras.produtos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  nome text not null,
  ean text,
  ncm text,
  categoria text,
  unidade_base text,
  criado_em timestamptz not null default now()
);
alter table compras.produtos enable row level security;
create unique index produtos_ean_por_org on compras.produtos (organizacao_id, ean) where ean is not null;

create table compras.notas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  chave char(44) not null check (chave ~ '^[0-9]{44}$'),
  numero text,
  serie text,
  emitida_em timestamptz not null,
  fornecedor_id uuid references compras.fornecedores (id) on delete set null,
  valor_total numeric(18, 2) not null,
  -- Dados identificadores do destinatário: anonimizados na exclusão de conta.
  destinatario_nome text,
  destinatario_documento text,
  destinatario_email text,
  -- XML original, intacto, no bucket de retenção (nunca no banco — decisão do doc).
  xml_storage_path text,
  origem text not null check (origem in ('dfe', 'upload', 'email')),
  importada_em timestamptz not null default now(),
  anonimizada_em timestamptz,
  unique (organizacao_id, chave)
);
alter table compras.notas enable row level security;
create index notas_org_data_idx on compras.notas (organizacao_id, emitida_em desc);

create table compras.itens_compra (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  nota_id uuid not null references compras.notas (id) on delete cascade,
  produto_id uuid references compras.produtos (id) on delete set null,
  numero_item integer not null,
  descricao text not null,
  ean text,
  ncm text,
  cfop text,
  quantidade numeric(18, 4) not null,
  unidade text not null,
  valor_unitario numeric(18, 6) not null,
  valor_total numeric(18, 2) not null,
  unique (nota_id, numero_item)
);
alter table compras.itens_compra enable row level security;
create index itens_compra_produto_idx on compras.itens_compra (organizacao_id, produto_id);

-- RF-30: vínculo confirmado uma vez vale para as próximas licitações com a mesma descrição.
create table compras.vinculos_licitacao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  produto_id uuid not null references compras.produtos (id) on delete cascade,
  descricao_normalizada text not null,
  unidade_licitacao text,
  fator_conversao numeric(18, 6) not null default 1 check (fator_conversao > 0),
  confirmado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (organizacao_id, descricao_normalizada)
);
alter table compras.vinculos_licitacao enable row level security;

-- Leitura por membro em tudo; escrita do cliente só onde há ação do usuário (catálogo e vínculos).
-- Notas e itens chegam pelo importador no servidor.
create policy fornecedores_select_org on compras.fornecedores for select to authenticated using (core.eh_membro(organizacao_id));
create policy notas_select_org on compras.notas for select to authenticated using (core.eh_membro(organizacao_id));
create policy itens_compra_select_org on compras.itens_compra for select to authenticated using (core.eh_membro(organizacao_id));
create policy itens_compra_update_org on compras.itens_compra for update to authenticated
  using (core.eh_membro(organizacao_id)) with check (core.eh_membro(organizacao_id));
create policy produtos_org on compras.produtos for all to authenticated
  using (core.eh_membro(organizacao_id)) with check (core.eh_membro(organizacao_id));
create policy vinculos_org on compras.vinculos_licitacao for all to authenticated
  using (core.eh_membro(organizacao_id)) with check (core.eh_membro(organizacao_id));

grant select on compras.sync_dfe, compras.fornecedores, compras.notas, compras.itens_compra to authenticated;
-- Agrupar produto (RF-22) = trocar produto_id do item. Só essa coluna.
grant update (produto_id) on compras.itens_compra to authenticated;
grant select, insert, update, delete on compras.produtos, compras.vinculos_licitacao to authenticated;

grant all on all tables in schema compras to service_role;
grant all on all sequences in schema compras to service_role;
