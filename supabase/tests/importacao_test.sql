-- Testes da importação de NF-e (compras.importar_nota) e do custo por produto.
-- Autocontido: usuários e CNPJs próprios, sem depender do rls_test.sql.

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.local');

create temporary table ids_importacao (nome text primary key, id uuid);
grant all on ids_importacao to public;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
insert into ids_importacao values ('org_d1', core.criar_organizacao('06990590000123', 'Atacado D1 Ltda'));
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d2';
insert into ids_importacao values ('org_d2', core.criar_organizacao('33000167000101', 'Mercado D2 Ltda'));
commit;

-- Nota de exemplo: dois itens, um com EAN e outro sem.
create temporary table nota_exemplo as select jsonb_build_object(
  'chave', '25260911222333000181550010000001231000001234',
  'numero', '123', 'serie', '1', 'emitidaEm', to_char(now() - interval '3 days', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
  'emitente', jsonb_build_object('documento', '45987005000198', 'nome', 'Cerealista Exemplo', 'uf', 'PB'),
  'destinatario', jsonb_build_object('documento', '06990590000123', 'nome', 'Atacado D1 Ltda'),
  'valorTotal', 350,
  'itens', jsonb_build_array(
    jsonb_build_object('numeroItem', 1, 'descricao', 'ARROZ BRANCO T1 1KG', 'ean', '7891234567895', 'ncm', '10063021',
                       'cfop', '5102', 'quantidade', 50, 'unidade', 'PCT', 'valorUnitario', 5, 'valorTotal', 250),
    jsonb_build_object('numeroItem', 2, 'descricao', 'FEIJAO CARIOCA 1KG', 'ean', null, 'ncm', '07133399',
                       'cfop', '5102', 'quantidade', 10, 'unidade', 'PCT', 'valorUnitario', 10, 'valorTotal', 100)
  )) as nota;
grant select on nota_exemplo to public;

-- 1. Quem não é membro não importa na org dos outros.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d2';
do $$
begin
  perform compras.importar_nota((select id from ids_importacao where nome = 'org_d1'), (select nota from nota_exemplo));
  raise exception 'FALHOU: não-membro importou nota em outra organização';
exception when insufficient_privilege then null;
end $$;
commit;

-- 2. anon não importa.
begin;
set local role anon;
do $$
begin
  perform compras.importar_nota((select id from ids_importacao where nome = 'org_d1'), (select nota from nota_exemplo));
  raise exception 'FALHOU: anon importou nota';
exception when insufficient_privilege then null;
end $$;
commit;

-- 3. Membro importa; a segunda vez não duplica; produtos e itens criados; e-mail não guardado.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
do $$
declare
  v_org uuid := (select id from ids_importacao where nome = 'org_d1');
  r jsonb;
begin
  r := compras.importar_nota(v_org, (select nota from nota_exemplo));
  if (r ->> 'nova')::boolean is not true then raise exception 'FALHOU: primeira importação não foi nova'; end if;
  r := compras.importar_nota(v_org, (select nota from nota_exemplo));
  if (r ->> 'nova')::boolean is not false then raise exception 'FALHOU: nota duplicada'; end if;
  if (select count(*) from compras.notas where organizacao_id = v_org) <> 1 then raise exception 'FALHOU: contagem de notas'; end if;
  if (select count(*) from compras.itens_compra where organizacao_id = v_org) <> 2 then raise exception 'FALHOU: contagem de itens'; end if;
  if (select count(*) from compras.produtos where organizacao_id = v_org) <> 2 then raise exception 'FALHOU: produtos não criados'; end if;
  if exists (select 1 from compras.itens_compra where organizacao_id = v_org and produto_id is null) then
    raise exception 'FALHOU: item sem produto';
  end if;
  if exists (select 1 from compras.notas where organizacao_id = v_org and destinatario_email is not null) then
    raise exception 'FALHOU: e-mail do destinatário foi guardado';
  end if;
  if (select custo_medio from compras.custos_produtos(v_org) where nome = 'ARROZ BRANCO T1 1KG') <> 5 then
    raise exception 'FALHOU: custo médio do arroz';
  end if;
end $$;
commit;

-- 4. Outra organização não vê as notas nem os custos da D1.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d2';
do $$
begin
  if exists (select 1 from compras.notas) then raise exception 'FALHOU: D2 vê notas da D1'; end if;
  if exists (select 1 from compras.custos_produtos((select id from ids_importacao where nome = 'org_d1'))) then
    raise exception 'FALHOU: D2 vê custos da D1';
  end if;
end $$;
commit;

-- 5. Entrada inválida é recusada.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
do $$
begin
  perform compras.importar_nota((select id from ids_importacao where nome = 'org_d1'),
    (select jsonb_set(nota, '{chave}', '"123"') from nota_exemplo));
  raise exception 'FALHOU: chave inválida aceita';
exception when invalid_parameter_value then null;
end $$;
do $$
begin
  perform compras.importar_nota((select id from ids_importacao where nome = 'org_d1'),
    (select jsonb_set(jsonb_set(nota, '{chave}', '"25260911222333000181550010000009991000009999"'), '{itens}', '[]') from nota_exemplo));
  raise exception 'FALHOU: nota sem itens aceita';
exception when invalid_parameter_value then null;
end $$;
commit;

\echo 'importacao_test: todos os casos passaram'
