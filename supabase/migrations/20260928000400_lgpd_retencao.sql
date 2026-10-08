-- Exclusão de conta em dois trilhos (docs/politica-retencao-dados.md).
-- Trilho 1: dados cadastrais e de uso — apagados na hora.
-- Trilho 2: dados de nota fiscal — ficam pelo prazo legal, com o destinatário anonimizado.
--           O XML original fica intacto no bucket xml-retencao (cold storage), fora do banco.

/**
 * Pedido de exclusão feito pelo dono. Executa os dois trilhos numa transação e registra o pedido.
 * O usuário em auth.users é removido depois, pela Edge Function de exclusão (Admin API).
 */
create function core.solicitar_exclusao(p_organizacao uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido uuid;
  v_notas integer;
  v_cert record;
begin
  if not core.eh_dono(p_organizacao) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  insert into core.solicitacoes_titular (organizacao_id, tipo, solicitado_por)
    values (p_organizacao, 'exclusao', auth.uid())
    returning id into v_pedido;

  -- Trilho 1 — cadastro e uso.
  for v_cert in select id, pfx_secret_id, senha_secret_id from compras.certificados where organizacao_id = p_organizacao loop
    delete from vault.secrets where id in (v_cert.pfx_secret_id, v_cert.senha_secret_id);
  end loop;
  delete from compras.certificados where organizacao_id = p_organizacao;
  delete from compras.sync_dfe where organizacao_id = p_organizacao;
  delete from compras.vinculos_licitacao where organizacao_id = p_organizacao;
  delete from licita.matches where organizacao_id = p_organizacao;
  delete from licita.funil where organizacao_id = p_organizacao;
  delete from licita.regras_radar where organizacao_id = p_organizacao;
  delete from core.notificacoes where organizacao_id = p_organizacao;
  delete from core.dispositivos_push where organizacao_id = p_organizacao;
  update core.assinaturas set status = 'cancelada', gateway_cliente_id = null, atualizado_em = now()
    where organizacao_id = p_organizacao;

  -- Trilho 2 — retenção legal com anonimização. Valores agregados permanecem.
  update compras.notas
    set destinatario_nome = null, destinatario_documento = null, destinatario_email = null, anonimizada_em = now()
    where organizacao_id = p_organizacao;
  get diagnostics v_notas = row_count;

  -- Fornecedor pessoa física (CPF de 11 dígitos) também é dado pessoal de terceiro.
  update compras.fornecedores set documento = null, nome = 'Fornecedor pessoa física'
    where organizacao_id = p_organizacao and documento ~ '^[0-9]{11}$';

  -- A organização vira um identificador anônimo (o próprio uuid).
  update core.organizacoes
    set cnpj = null, razao_social = 'Organização excluída', nome_fantasia = null,
        municipio = null, exclusao_solicitada_em = now()
    where id = p_organizacao;

  update core.solicitacoes_titular
    set concluido_em = now(),
        detalhes = jsonb_build_object('notas_anonimizadas', v_notas, 'retencao_ate', (now() + interval '5 years')::date)
    where id = v_pedido;

  -- Por último: tira o acesso de todos os membros.
  delete from core.membros where organizacao_id = p_organizacao;

  return v_pedido;
end;
$$;
revoke all on function core.solicitar_exclusao(uuid) from public;
grant execute on function core.solicitar_exclusao(uuid) to authenticated;

-- Bucket privado do XML original. Sem nenhuma política para anon/authenticated:
-- só o servidor (service_role) grava e lê. Guardado para ambientes sem o esquema storage
-- (os testes de RLS rodam em Postgres puro).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('xml-retencao', 'xml-retencao', false)
    on conflict (id) do nothing;
  end if;
end;
$$;
