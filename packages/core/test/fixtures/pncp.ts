// Fixtures no formato da API de consulta do PNCP (campos que usamos + alguns extras,
// para provar que campos desconhecidos não quebram a validação).
export const contratacaoPb = {
  numeroControlePNCP: '08944246000137-1-000045/2026',
  anoCompra: 2026,
  sequencialCompra: 45,
  numeroCompra: '45',
  processo: '0123/2026',
  orgaoEntidade: {
    cnpj: '08944246000137',
    razaoSocial: 'MUNICIPIO DE PATOS',
    poderId: 'E',
    esferaId: 'M',
  },
  unidadeOrgao: {
    ufSigla: 'PB',
    ufNome: 'Paraíba',
    municipioNome: 'Patos',
    codigoIbge: '2510808',
    nomeUnidade: 'Secretaria de Educação',
    codigoUnidade: '1',
  },
  modalidadeId: 6,
  modalidadeNome: 'Pregão - Eletrônico',
  objetoCompra: 'Aquisição de GÊNEROS ALIMENTÍCIOS do tipo hortifruti para a merenda escolar',
  valorTotalEstimado: 152340.5,
  valorTotalHomologado: null,
  situacaoCompraId: 1,
  situacaoCompraNome: 'Divulgada no PNCP',
  dataPublicacaoPncp: '2026-08-01T10:15:00',
  dataAberturaProposta: '2026-08-02T08:00:00',
  dataEncerramentoProposta: '2026-08-15T09:00:00',
  linkSistemaOrigem: 'https://exemplo.gov.br/edital/45',
  srp: true,
  amparoLegal: { codigo: 1, nome: 'Lei 14.133/2021, Art. 28, I' },
};

export const itemArroz = {
  numeroItem: 1,
  descricao: 'Arroz branco tipo 1, pacote 5 kg',
  materialOuServico: 'M',
  quantidade: 1200,
  unidadeMedida: 'Pacote',
  valorUnitarioEstimado: 28.9,
  valorTotal: 34680,
  situacaoCompraItem: 2,
  temResultado: true,
  orcamentoSigiloso: false,
};

export const resultadoPj = {
  sequencialResultado: 1,
  niFornecedor: '12345678000195',
  tipoPessoa: 'PJ',
  nomeRazaoSocialFornecedor: 'Comercial de Alimentos Ltda',
  quantidadeHomologada: 1200,
  valorUnitarioHomologado: 76.62,
  valorTotalHomologado: 91944,
  dataResultado: '2026-08-20T14:30:00',
};

export const resultadoPf = {
  ...resultadoPj,
  sequencialResultado: 2,
  niFornecedor: '123.456.789-09',
  tipoPessoa: 'PF',
  nomeRazaoSocialFornecedor: 'José da Silva',
};
