-- Testes de RLS e privilégios. Cada bloco falha com exceção (e derruba o CI) se a regra quebrar.
-- Roda como postgres; troca de identidade com `set local role` + claim do JWT.

create schema tests;
grant usage on schema tests to public;

-- Executa um SQL e diz se ele FALHOU (qualquer erro: RLS, grant, constraint).
create function tests.falha(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end $$;
grant execute on function tests.falha(text) to public;

create function tests.conta(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  return n;
end $$;
grant execute on function tests.conta(text) to public;

-- ---------------------------------------------------------------------------
-- 0. Meta: RLS ativa em TODA tabela dos três domínios. Sem exceção.
-- ---------------------------------------------------------------------------
do $$
declare v_sem_rls text;
begin
  select string_agg(n.nspname || '.' || c.relname, ', ') into v_sem_rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('core', 'licita', 'compras') and c.relkind in ('r', 'p') and not c.relrowsecurity;
  if v_sem_rls is not null then
    raise exception 'FALHOU: tabelas sem RLS: %', v_sem_rls;
  end if;
end $$;

-- Nenhuma tabela dos três domínios pode ter política de escrita para anon.
do $$
declare v text;
begin
  select string_agg(schemaname || '.' || tablename || ':' || policyname, ', ') into v
  from pg_policies
  where schemaname in ('core', 'licita', 'compras') and 'anon' = any (roles) and cmd <> 'SELECT';
  if v is not null then raise exception 'FALHOU: política de escrita para anon: %', v; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Massa: usuários A (dono org A), B (dono org B), C (membro da org A)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.local'),
  ('00000000-0000-0000-0000-00000000000c', 'c@teste.local');

create table tests.ids (nome text primary key, id uuid);
grant all on tests.ids to public;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into tests.ids values ('org_a', core.criar_organizacao('11222333000181', 'Distribuidora A Ltda'));
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into tests.ids values ('org_b', core.criar_organizacao('44555666000199', 'Mercadinho B Ltda'));
commit;

-- C entra na org A como membro (inserido pelo dono A).
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into core.membros (organizacao_id, user_id, papel)
  values ((select id from tests.ids where nome = 'org_a'), '00000000-0000-0000-0000-00000000000c', 'membro');
commit;

-- Dados públicos e privados de apoio (como servidor).
insert into licita.contratacoes (numero_controle_pncp, orgao_cnpj, orgao_razao_social, ano_compra, sequencial_compra, uf, modalidade_id, objeto, data_encerramento_proposta)
values ('08999999000100-1-000045/2026', '08999999000100', 'Prefeitura Teste', 2026, 45, 'PB', 6, 'Aquisição de gêneros alimentícios', now() + interval '5 days');
insert into licita.itens (numero_controle_pncp, numero_item, descricao) values ('08999999000100-1-000045/2026', 1, 'Arroz tipo 1');

insert into licita.regras_radar (organizacao_id, termos, ufs) select id, '{arroz}', '{PB}' from tests.ids where nome = 'org_a';
insert into licita.funil (organizacao_id, numero_controle_pncp) select id, '08999999000100-1-000045/2026' from tests.ids where nome = 'org_a';
insert into compras.notas (organizacao_id, chave, emitida_em, valor_total, destinatario_nome, destinatario_documento, destinatario_email, origem)
  select id, repeat('1', 44), now(), 1500, 'Fulano de Tal', '12345678909', 'fulano@teste.local', 'upload' from tests.ids where nome = 'org_a';
insert into compras.fornecedores (organizacao_id, documento, nome)
  select id, '98765432100', 'Seu Zé Hortifruti' from tests.ids where nome = 'org_a';

set role service_role;
select compras.salvar_certificado(
  (select id from tests.ids where nome = 'org_a'), '11222333000181', 'DISTRIBUIDORA A LTDA', 'e-CNPJ',
  now() - interval '1 day', now() + interval '1 year', 'UEZYLWZha2U=', 'senha-falsa', '00000000-0000-0000-0000-00000000000a');
reset role;

-- ---------------------------------------------------------------------------
-- 1. anon: lê dado público, não vê nada privado, não escreve nada.
-- ---------------------------------------------------------------------------
begin;
set local role anon;
do $$ begin
  if tests.conta('select * from licita.contratacoes') <> 1 then raise exception 'FALHOU: anon deveria ler contratacoes'; end if;
  if tests.conta('select * from licita.catalogo_termos') < 10 then raise exception 'FALHOU: anon deveria ler o catálogo'; end if;
  if not tests.falha('select * from core.organizacoes') then raise exception 'FALHOU: anon leu organizacoes'; end if;
  if not tests.falha('select * from licita.regras_radar') then raise exception 'FALHOU: anon leu regras_radar'; end if;
  if not tests.falha('select * from compras.notas') then raise exception 'FALHOU: anon leu notas'; end if;
  if not tests.falha('select * from core.log_jobs') then raise exception 'FALHOU: anon leu log_jobs'; end if;
  if not tests.falha($q$insert into licita.contratacoes (numero_controle_pncp, orgao_cnpj, orgao_razao_social, ano_compra, sequencial_compra, uf, modalidade_id, objeto) values ('x', 'x', 'x', 2026, 1, 'PB', 6, 'x')$q$) then
    raise exception 'FALHOU: anon inseriu contratacao';
  end if;
  if not tests.falha('select * from vault.secrets') then raise exception 'FALHOU: anon leu o Vault'; end if;
end $$;
commit;

-- ---------------------------------------------------------------------------
-- 2. Isolamento entre organizações (RN-06)
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  if tests.conta('select * from core.organizacoes') <> 1 then raise exception 'FALHOU: B deveria ver só a própria org'; end if;
  if tests.conta('select * from licita.regras_radar') <> 0 then raise exception 'FALHOU: B viu radar de A'; end if;
  if tests.conta('select * from licita.funil') <> 0 then raise exception 'FALHOU: B viu funil de A'; end if;
  if tests.conta('select * from compras.notas') <> 0 then raise exception 'FALHOU: B viu notas de A'; end if;
  if tests.conta('select id from compras.certificados') <> 0 then raise exception 'FALHOU: B viu certificado de A'; end if;
  if tests.conta('select * from core.membros') <> 1 then raise exception 'FALHOU: B viu membros de A'; end if;
  if not tests.falha(format('insert into licita.regras_radar (organizacao_id) values (%L)', (select id from tests.ids where nome = 'org_a'))) then
    raise exception 'FALHOU: B criou regra na org A';
  end if;
  if tests.conta('select * from licita.contratacoes') <> 1 then raise exception 'FALHOU: dado público deveria ser visível a B'; end if;
end $$;
commit;

-- ---------------------------------------------------------------------------
-- 3. Papéis dentro da mesma org: membro C não vê cobrança nem revoga certificado (RF-03)
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  if tests.conta('select * from licita.regras_radar') <> 1 then raise exception 'FALHOU: membro C deveria ver o radar da org'; end if;
  if tests.conta('select * from core.assinaturas') <> 0 then raise exception 'FALHOU: membro C viu cobrança'; end if;
  if not tests.falha(format('select compras.revogar_certificado(%L)', (select id from compras.certificados limit 1))) then
    raise exception 'FALHOU: membro revogou certificado';
  end if;
  if not tests.falha(format('select core.solicitar_exclusao(%L)', (select id from tests.ids where nome = 'org_a'))) then
    raise exception 'FALHOU: membro pediu exclusão da org';
  end if;
  if not tests.falha(format('insert into core.membros (organizacao_id, user_id) values (%L, %L)',
      (select id from tests.ids where nome = 'org_a'), '00000000-0000-0000-0000-00000000000b')) then
    raise exception 'FALHOU: membro adicionou outro membro';
  end if;
end $$;
commit;

-- ---------------------------------------------------------------------------
-- 4. Certificado: segredo nunca sai para o cliente (RN-02)
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if tests.conta('select id, cnpj, valido_ate from compras.certificados') <> 1 then raise exception 'FALHOU: dono deveria ver metadados do certificado'; end if;
  if not tests.falha('select pfx_secret_id from compras.certificados') then raise exception 'FALHOU: cliente leu id do segredo'; end if;
  if not tests.falha('select * from compras.certificados') then raise exception 'FALHOU: select * expôs colunas do cofre'; end if;
  if not tests.falha(format('select * from compras.ler_certificado(%L, %L)', (select id from compras.certificados limit 1), 'x')) then
    raise exception 'FALHOU: cliente leu o certificado decifrado';
  end if;
  if not tests.falha($q$select compras.salvar_certificado(gen_random_uuid(), '1', '1', 'e-CNPJ', now(), now(), 'x', 'x', null)$q$) then
    raise exception 'FALHOU: cliente chamou salvar_certificado';
  end if;
  if not tests.falha('select * from vault.decrypted_secrets') then raise exception 'FALHOU: cliente leu o Vault'; end if;
end $$;
commit;

-- Servidor lê, e a leitura fica auditada.
set role service_role;
do $$
declare v_senha text;
begin
  select senha into v_senha from compras.ler_certificado((select id from compras.certificados where revogado_em is null limit 1), 'teste-importador');
  if v_senha is distinct from 'senha-falsa' then raise exception 'FALHOU: servidor não leu o certificado'; end if;
  if (select count(*) from compras.acessos_certificado where acao = 'leitura') <> 1 then raise exception 'FALHOU: leitura não auditada'; end if;
end $$;
reset role;

-- Dono revoga: segredos somem do Vault.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select compras.revogar_certificado((select id from compras.certificados limit 1));
commit;
do $$ begin
  if (select count(*) from vault.secrets) <> 0 then raise exception 'FALHOU: revogação deixou segredo no Vault'; end if;
  if (select count(*) from compras.certificados where revogado_em is null) <> 0 then raise exception 'FALHOU: certificado continua ativo'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Tabelas internas e limite de taxa
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if not tests.falha('select * from core.log_jobs') then raise exception 'FALHOU: cliente leu log_jobs'; end if;
  if not tests.falha('select * from core.limites_taxa') then raise exception 'FALHOU: cliente leu limites_taxa'; end if;
  if not tests.falha($q$update core.assinaturas set plano = 'completo'$q$) then raise exception 'FALHOU: cliente mudou o próprio plano (RN-01)'; end if;
end $$;
commit;

begin;
set local role anon;
do $$ begin
  if not core.consumir_limite('chave-de-teste-0123456789', 2, 60) then raise exception 'FALHOU: 1ª chamada negada'; end if;
  if not core.consumir_limite('chave-de-teste-0123456789', 2, 60) then raise exception 'FALHOU: 2ª chamada negada'; end if;
  if core.consumir_limite('chave-de-teste-0123456789', 2, 60) then raise exception 'FALHOU: 3ª chamada passou do limite'; end if;
  if not tests.falha($q$select core.consumir_limite('curta', 2, 60)$q$) then raise exception 'FALHOU: chave curta aceita'; end if;
end $$;
commit;

-- CPF em claro de pessoa física não entra em resultados.
do $$ begin
  if not tests.falha($q$insert into licita.resultados (numero_controle_pncp, numero_item, sequencial_resultado, fornecedor_documento, tipo_pessoa)
    values ('08999999000100-1-000045/2026', 1, 1, '12345678909', 'PF')$q$) then
    raise exception 'FALHOU: CPF em claro aceito em resultados';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Exclusão de conta em dois trilhos
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select core.solicitar_exclusao((select id from tests.ids where nome = 'org_a'));
commit;

do $$
declare v_org uuid := (select id from tests.ids where nome = 'org_a');
begin
  -- Trilho 1: cadastro e uso apagados.
  if exists (select 1 from licita.regras_radar where organizacao_id = v_org) then raise exception 'FALHOU: radar sobreviveu à exclusão'; end if;
  if exists (select 1 from licita.funil where organizacao_id = v_org) then raise exception 'FALHOU: funil sobreviveu à exclusão'; end if;
  if exists (select 1 from compras.certificados where organizacao_id = v_org) then raise exception 'FALHOU: certificado sobreviveu à exclusão'; end if;
  if exists (select 1 from core.membros where organizacao_id = v_org) then raise exception 'FALHOU: membros mantiveram acesso'; end if;
  if (select cnpj from core.organizacoes where id = v_org) is not null then raise exception 'FALHOU: CNPJ não foi anonimizado'; end if;
  -- Trilho 2: nota fica, sem identificação do destinatário.
  if (select count(*) from compras.notas where organizacao_id = v_org) <> 1 then raise exception 'FALHOU: nota fiscal foi apagada (retenção legal)'; end if;
  if exists (select 1 from compras.notas where organizacao_id = v_org
             and (destinatario_nome is not null or destinatario_documento is not null or destinatario_email is not null)) then
    raise exception 'FALHOU: nota manteve dado pessoal';
  end if;
  if (select valor_total from compras.notas where organizacao_id = v_org) <> 1500 then raise exception 'FALHOU: valor agregado perdido'; end if;
  if exists (select 1 from compras.fornecedores where organizacao_id = v_org and documento is not null) then
    raise exception 'FALHOU: CPF de fornecedor pessoa física manteve-se';
  end if;
  if (select concluido_em from core.solicitacoes_titular where organizacao_id = v_org and tipo = 'exclusao') is null then
    raise exception 'FALHOU: pedido não registrado como concluído';
  end if;
end $$;

-- Depois da exclusão, o ex-dono não vê mais nada.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if tests.conta('select * from core.organizacoes') <> 0 then raise exception 'FALHOU: ex-dono ainda vê a org'; end if;
  if tests.conta('select * from compras.notas') <> 0 then raise exception 'FALHOU: ex-dono ainda vê notas'; end if;
end $$;
commit;

\echo 'rls_test: todos os casos passaram'
