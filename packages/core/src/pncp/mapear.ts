import { mascararDocumentoFornecedor } from '../lgpd';
import type { ContratacaoPncp, ItemPncp, ResultadoPncp } from './schemas';

/** Linha de licita.contratacoes, como o coletor grava. */
export interface LinhaContratacao {
  numero_controle_pncp: string;
  orgao_cnpj: string;
  orgao_razao_social: string;
  ano_compra: number;
  sequencial_compra: number;
  numero_compra: string | null;
  processo: string | null;
  unidade_nome: string | null;
  uf: string;
  municipio: string | null;
  codigo_ibge: string | null;
  modalidade_id: number;
  modalidade_nome: string | null;
  objeto: string;
  valor_total_estimado: number | null;
  valor_total_homologado: number | null;
  situacao_id: number | null;
  situacao_nome: string | null;
  data_publicacao: string | null;
  data_abertura_proposta: string | null;
  data_encerramento_proposta: string | null;
  link_sistema_origem: string | null;
  termos_casados: string[];
  atualizado_em: string;
}

/**
 * Converte a contratação do PNCP na linha do banco.
 * @param c Contratação já validada.
 * @param termos Termos do catálogo casados no objeto e nos itens.
 */
export function paraLinhaContratacao(c: ContratacaoPncp, termos: string[]): LinhaContratacao {
  return {
    numero_controle_pncp: c.numeroControlePNCP,
    orgao_cnpj: c.orgaoEntidade.cnpj,
    orgao_razao_social: c.orgaoEntidade.razaoSocial,
    ano_compra: c.anoCompra,
    sequencial_compra: c.sequencialCompra,
    numero_compra: c.numeroCompra,
    processo: c.processo,
    unidade_nome: c.unidadeOrgao.nomeUnidade,
    uf: c.unidadeOrgao.ufSigla.toUpperCase(),
    municipio: c.unidadeOrgao.municipioNome,
    codigo_ibge: c.unidadeOrgao.codigoIbge ?? null,
    modalidade_id: c.modalidadeId,
    modalidade_nome: c.modalidadeNome,
    objeto: c.objetoCompra,
    valor_total_estimado: c.valorTotalEstimado ?? null,
    valor_total_homologado: c.valorTotalHomologado ?? null,
    situacao_id: c.situacaoCompraId ?? null,
    situacao_nome: c.situacaoCompraNome,
    data_publicacao: c.dataPublicacaoPncp,
    data_abertura_proposta: c.dataAberturaProposta,
    data_encerramento_proposta: c.dataEncerramentoProposta,
    link_sistema_origem: c.linkSistemaOrigem,
    termos_casados: termos,
    atualizado_em: new Date().toISOString(),
  };
}

/** Linha de licita.itens. */
export interface LinhaItem {
  numero_controle_pncp: string;
  numero_item: number;
  descricao: string;
  material_ou_servico: string | null;
  quantidade: number | null;
  unidade_medida: string | null;
  valor_unitario_estimado: number | null;
  valor_total: number | null;
  situacao_id: number | null;
  tem_resultado: boolean;
  termos_casados: string[];
  atualizado_em: string;
}

/**
 * Converte um item do PNCP na linha do banco.
 * @param numeroControle numeroControlePNCP da contratação-mãe.
 */
export function paraLinhaItem(numeroControle: string, i: ItemPncp, termos: string[]): LinhaItem {
  return {
    numero_controle_pncp: numeroControle,
    numero_item: i.numeroItem,
    descricao: i.descricao,
    material_ou_servico: i.materialOuServico ?? null,
    quantidade: i.quantidade ?? null,
    unidade_medida: i.unidadeMedida,
    valor_unitario_estimado: i.valorUnitarioEstimado ?? null,
    valor_total: i.valorTotal ?? null,
    situacao_id: i.situacaoCompraItem ?? null,
    tem_resultado: i.temResultado,
    termos_casados: termos,
    atualizado_em: new Date().toISOString(),
  };
}

/** Linha de licita.resultados. CPF de pessoa física já sai mascarado daqui. */
export interface LinhaResultado {
  numero_controle_pncp: string;
  numero_item: number;
  sequencial_resultado: number;
  fornecedor_documento: string | null;
  fornecedor_nome: string | null;
  tipo_pessoa: string | null;
  quantidade_homologada: number | null;
  valor_unitario_homologado: number | null;
  valor_total_homologado: number | null;
  data_resultado: string | null;
  atualizado_em: string;
}

/**
 * Converte um resultado do PNCP na linha do banco, mascarando CPF (docs/adr/0006).
 * @param indice Posição na lista, usada quando o PNCP não informa sequencialResultado.
 */
export function paraLinhaResultado(
  numeroControle: string,
  numeroItem: number,
  r: ResultadoPncp,
  indice: number,
): LinhaResultado {
  return {
    numero_controle_pncp: numeroControle,
    numero_item: numeroItem,
    sequencial_resultado: r.sequencialResultado ?? indice + 1,
    fornecedor_documento: mascararDocumentoFornecedor(r.niFornecedor, r.tipoPessoa),
    fornecedor_nome: r.nomeRazaoSocialFornecedor,
    tipo_pessoa: r.tipoPessoa ?? null,
    quantidade_homologada: r.quantidadeHomologada ?? null,
    valor_unitario_homologado: r.valorUnitarioHomologado ?? null,
    valor_total_homologado: r.valorTotalHomologado ?? null,
    data_resultado: r.dataResultado,
    atualizado_em: new Date().toISOString(),
  };
}
