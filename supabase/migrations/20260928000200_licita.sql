-- Margem Licita — dados públicos do PNCP (leitura aberta) + dados privados por organização.
-- Escrita nas tabelas públicas: só service_role (coletor). Nenhuma política de escrita existe.

-- ---------------------------------------------------------------------------
-- Públicas (dados do PNCP)
-- ---------------------------------------------------------------------------
create table licita.contratacoes (
  numero_controle_pncp text primary key,
  orgao_cnpj text not null,
  orgao_razao_social text not null,
  ano_compra integer not null,
  sequencial_compra integer not null,
  numero_compra text,
  processo text,
  unidade_nome text,
  uf char(2) not null,
  municipio text,
  codigo_ibge text,
  modalidade_id integer not null,
  modalidade_nome text,
  objeto text not null,
  valor_total_estimado numeric(18, 4),
  valor_total_homologado numeric(18, 4),
  situacao_id integer,
  situacao_nome text,
  data_publicacao timestamptz,
  data_abertura_proposta timestamptz,
  data_encerramento_proposta timestamptz,
  link_sistema_origem text,
  -- Termos do catálogo de alimentos que casaram com o objeto ou com os itens.
  termos_casados text[] not null default '{}',
  coletado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (orgao_cnpj, ano_compra, sequencial_compra)
);
alter table licita.contratacoes enable row level security;
create index contratacoes_uf_prazo_idx on licita.contratacoes (uf, data_encerramento_proposta);
create index contratacoes_termos_idx on licita.contratacoes using gin (termos_casados);

create table licita.itens (
  numero_controle_pncp text not null references licita.contratacoes (numero_controle_pncp) on delete cascade,
  numero_item integer not null,
  descricao text not null,
  material_ou_servico char(1),
  quantidade numeric(18, 4),
  unidade_medida text,
  valor_unitario_estimado numeric(18, 4),
  valor_total numeric(18, 4),
  situacao_id integer,
  tem_resultado boolean not null default false,
  termos_casados text[] not null default '{}',
  atualizado_em timestamptz not null default now(),
  primary key (numero_controle_pncp, numero_item)
);
alter table licita.itens enable row level security;
create index itens_termos_idx on licita.itens using gin (termos_casados);

create table licita.resultados (
  numero_controle_pncp text not null,
  numero_item integer not null,
  sequencial_resultado integer not null,
  -- CNPJ inteiro; CPF de pessoa física chega MASCARADO pelo coletor (docs/adr/0006).
  fornecedor_documento text,
  fornecedor_nome text,
  tipo_pessoa text check (tipo_pessoa in ('PJ', 'PF', 'PE')),
  quantidade_homologada numeric(18, 4),
  valor_unitario_homologado numeric(18, 4),
  valor_total_homologado numeric(18, 4),
  data_resultado timestamptz,
  atualizado_em timestamptz not null default now(),
  primary key (numero_controle_pncp, numero_item, sequencial_resultado),
  foreign key (numero_controle_pncp, numero_item)
    references licita.itens (numero_controle_pncp, numero_item) on delete cascade,
  -- Defesa em profundidade: nenhum CPF de 11 dígitos em claro entra na tabela.
  constraint resultados_sem_cpf_claro check (
    tipo_pessoa is distinct from 'PF' or fornecedor_documento is null or fornecedor_documento !~ '^[0-9]{11}$'
  )
);
alter table licita.resultados enable row level security;

create table licita.catalogo_termos (
  id integer generated always as identity primary key,
  termo text not null unique,
  categoria text not null,
  ativo boolean not null default true
);
alter table licita.catalogo_termos enable row level security;

-- Leitura pública das tabelas do PNCP (anon inclusive: o contador da landing usa).
create policy contratacoes_leitura_publica on licita.contratacoes for select to anon, authenticated using (true);
create policy itens_leitura_publica on licita.itens for select to anon, authenticated using (true);
create policy resultados_leitura_publica on licita.resultados for select to anon, authenticated using (true);
create policy catalogo_leitura_publica on licita.catalogo_termos for select to anon, authenticated using (ativo);

grant select on licita.contratacoes, licita.itens, licita.resultados, licita.catalogo_termos to anon, authenticated;

-- Catálogo inicial (RF-10). O coletor tem a mesma lista em packages/core; esta é a editável.
insert into licita.catalogo_termos (termo, categoria) values
  ('generos alimenticios', 'geral'),
  ('alimentacao escolar', 'merenda'),
  ('merenda', 'merenda'),
  ('arroz', 'graos'),
  ('feijao', 'graos'),
  ('macarrao', 'graos'),
  ('farinha', 'graos'),
  ('flocos de milho', 'graos'),
  ('fuba', 'graos'),
  ('acucar', 'mercearia'),
  ('cafe', 'mercearia'),
  ('oleo de soja', 'mercearia'),
  ('sal refinado', 'mercearia'),
  ('leite', 'laticinios'),
  ('queijo', 'laticinios'),
  ('iogurte', 'laticinios'),
  ('manteiga', 'laticinios'),
  ('carne', 'carnes'),
  ('frango', 'carnes'),
  ('peixe', 'carnes'),
  ('ovos', 'carnes'),
  ('charque', 'carnes'),
  ('hortifruti', 'hortifruti'),
  ('hortifrutigranjeiros', 'hortifruti'),
  ('frutas', 'hortifruti'),
  ('verduras', 'hortifruti'),
  ('legumes', 'hortifruti'),
  ('polpa de fruta', 'hortifruti'),
  ('pao', 'panificacao'),
  ('biscoito', 'panificacao');

-- ---------------------------------------------------------------------------
-- Privadas por organização
-- ---------------------------------------------------------------------------
create type licita.estagio_funil as enum ('interesse', 'proposta_enviada', 'ganhou', 'perdeu');

create table licita.regras_radar (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  nome text not null default 'Meu radar',
  termos text[] not null default '{}',
  ufs char(2)[] not null default '{}',
  municipios text[] not null default '{}',
  modalidades integer[] not null default '{}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table licita.regras_radar enable row level security;
create policy regras_radar_org on licita.regras_radar
  for all to authenticated
  using (core.eh_membro(organizacao_id))
  with check (core.eh_membro(organizacao_id));

create table licita.funil (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  numero_controle_pncp text not null references licita.contratacoes (numero_controle_pncp) on delete cascade,
  estagio licita.estagio_funil not null default 'interesse',
  nota text,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, numero_controle_pncp)
);
alter table licita.funil enable row level security;
create policy funil_org on licita.funil
  for all to authenticated
  using (core.eh_membro(organizacao_id))
  with check (core.eh_membro(organizacao_id));

create table licita.matches (
  organizacao_id uuid not null references core.organizacoes (id) on delete cascade,
  numero_controle_pncp text not null references licita.contratacoes (numero_controle_pncp) on delete cascade,
  regra_id uuid not null references licita.regras_radar (id) on delete cascade,
  termos text[] not null default '{}',
  criado_em timestamptz not null default now(),
  notificado_em timestamptz,
  primary key (organizacao_id, numero_controle_pncp, regra_id)
);
alter table licita.matches enable row level security;
-- Matches são gerados pelo servidor; o cliente só lê.
create policy matches_select_org on licita.matches
  for select to authenticated using (core.eh_membro(organizacao_id));

grant select, insert, update, delete on licita.regras_radar, licita.funil to authenticated;
grant select on licita.matches to authenticated;

grant all on all tables in schema licita to service_role;
grant all on all sequences in schema licita to service_role;
