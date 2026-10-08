-- =============================================================================
-- Compras: importação de NF-e por upload de XML (RF-21) e custo por produto (RF-30).
--
-- O site valida o XML (packages/core/src/dfe) e chama compras.importar_nota com a sessão do
-- usuário. A função é SECURITY DEFINER só para gravar em tabelas que o cliente não escreve
-- direto; quem decide o acesso é core.eh_membro, checado aqui dentro. A service role
-- continua fora do site.
-- =============================================================================

/**
 * Grava uma NF-e já validada: fornecedor, nota, produtos (casados por EAN ou pelo nome) e itens.
 * Idempotente pela chave de acesso: a mesma nota enviada de novo não duplica.
 * O e-mail do destinatário não é guardado (minimização, docs/lgpd.md).
 */
create function compras.importar_nota(p_organizacao uuid, p_nota jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chave text := p_nota ->> 'chave';
  v_nota uuid;
  v_fornecedor uuid;
  v_produto uuid;
  v_item jsonb;
  v_itens integer;
  v_ean text;
  v_emitente jsonb := p_nota -> 'emitente';
begin
  if auth.uid() is null or not core.eh_membro(p_organizacao) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  if v_chave is null or v_chave !~ '^[0-9]{44}$' then
    raise exception 'chave de acesso inválida' using errcode = '22023';
  end if;
  v_itens := jsonb_array_length(coalesce(p_nota -> 'itens', '[]'::jsonb));
  if v_itens < 1 or v_itens > 990 then
    raise exception 'nota sem itens ou com itens demais' using errcode = '22023';
  end if;

  select id into v_nota from compras.notas where organizacao_id = p_organizacao and chave = v_chave;
  if found then
    return jsonb_build_object('nota_id', v_nota, 'nova', false, 'itens', v_itens);
  end if;

  insert into compras.fornecedores as f (organizacao_id, documento, nome, uf)
  values (
    p_organizacao,
    nullif(v_emitente ->> 'documento', ''),
    left(coalesce(nullif(v_emitente ->> 'nome', ''), 'Fornecedor sem nome'), 200),
    nullif(v_emitente ->> 'uf', '')
  )
  on conflict (organizacao_id, documento) do update set nome = excluded.nome, uf = coalesce(excluded.uf, f.uf)
  returning id into v_fornecedor;

  insert into compras.notas
    (organizacao_id, chave, numero, serie, emitida_em, fornecedor_id, valor_total,
     destinatario_nome, destinatario_documento, origem)
  values (
    p_organizacao, v_chave, p_nota ->> 'numero', p_nota ->> 'serie', (p_nota ->> 'emitidaEm')::timestamptz,
    v_fornecedor, (p_nota ->> 'valorTotal')::numeric,
    left(p_nota #>> '{destinatario,nome}', 200), p_nota #>> '{destinatario,documento}', 'upload'
  )
  returning id into v_nota;

  for v_item in select * from jsonb_array_elements(p_nota -> 'itens') loop
    v_ean := nullif(v_item ->> 'ean', '');
    v_produto := null;
    if v_ean is not null then
      select id into v_produto from compras.produtos where organizacao_id = p_organizacao and ean = v_ean;
    end if;
    if v_produto is null then
      select id into v_produto from compras.produtos
      where organizacao_id = p_organizacao and lower(nome) = lower(v_item ->> 'descricao')
      order by criado_em limit 1;
    end if;
    if v_produto is null then
      insert into compras.produtos (organizacao_id, nome, ean, ncm, unidade_base)
      values (p_organizacao, left(v_item ->> 'descricao', 200), v_ean, v_item ->> 'ncm', v_item ->> 'unidade')
      returning id into v_produto;
    end if;

    insert into compras.itens_compra
      (organizacao_id, nota_id, produto_id, numero_item, descricao, ean, ncm, cfop,
       quantidade, unidade, valor_unitario, valor_total)
    values (
      p_organizacao, v_nota, v_produto, (v_item ->> 'numeroItem')::integer, left(v_item ->> 'descricao', 500),
      v_ean, v_item ->> 'ncm', v_item ->> 'cfop', (v_item ->> 'quantidade')::numeric,
      v_item ->> 'unidade', (v_item ->> 'valorUnitario')::numeric, (v_item ->> 'valorTotal')::numeric
    );
  end loop;

  return jsonb_build_object('nota_id', v_nota, 'nova', true, 'itens', v_itens);
end;
$$;
revoke all on function compras.importar_nota(uuid, jsonb) from public;
grant execute on function compras.importar_nota(uuid, jsonb) to authenticated;

/**
 * Custo por produto no período: médio ponderado pela quantidade, mínimo, máximo e o último.
 * SECURITY INVOKER: roda com a RLS de quem chama, então só enxerga a própria organização.
 */
create function compras.custos_produtos(p_organizacao uuid, p_dias integer default 60)
returns table (
  produto_id uuid,
  nome text,
  unidade text,
  compras bigint,
  quantidade numeric,
  custo_medio numeric,
  custo_minimo numeric,
  custo_maximo numeric,
  ultimo_custo numeric,
  ultima_compra timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    p.id,
    p.nome,
    coalesce(p.unidade_base, max(i.unidade)),
    count(*),
    sum(i.quantidade),
    round(sum(i.valor_total) / nullif(sum(i.quantidade), 0), 4),
    min(i.valor_unitario),
    max(i.valor_unitario),
    (array_agg(i.valor_unitario order by n.emitida_em desc))[1],
    max(n.emitida_em)
  from compras.itens_compra i
  join compras.notas n on n.id = i.nota_id
  join compras.produtos p on p.id = i.produto_id
  where i.organizacao_id = p_organizacao
    and n.emitida_em >= now() - make_interval(days => greatest(1, least(p_dias, 3650)))
  group by p.id, p.nome, p.unidade_base
  order by max(n.emitida_em) desc;
$$;
revoke all on function compras.custos_produtos(uuid, integer) from public;
grant execute on function compras.custos_produtos(uuid, integer) to authenticated;
