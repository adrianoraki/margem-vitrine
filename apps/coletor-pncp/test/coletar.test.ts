import { describe, expect, it } from 'vitest';
import type { ClientePncp, ContratacaoPncp, ItemPncp, ResultadoPncp } from '@margem/core/pncp';
import { coletar, novoResumo } from '../src/coletar';
import type { Repositorio } from '../src/tipos';

function contratacao(seq: number, objeto: string): ContratacaoPncp {
  return {
    numeroControlePNCP: `08944246000137-1-${String(seq).padStart(6, '0')}/2026`,
    anoCompra: 2026,
    sequencialCompra: seq,
    numeroCompra: String(seq),
    processo: null,
    orgaoEntidade: { cnpj: '08944246000137', razaoSocial: 'MUNICIPIO DE PATOS' },
    unidadeOrgao: {
      ufSigla: 'PB',
      municipioNome: 'Patos',
      codigoIbge: '2510808',
      nomeUnidade: null,
    },
    modalidadeId: 6,
    modalidadeNome: 'Pregão - Eletrônico',
    objetoCompra: objeto,
    valorTotalEstimado: 1000,
    valorTotalHomologado: null,
    situacaoCompraId: 1,
    situacaoCompraNome: null,
    dataPublicacaoPncp: '2026-09-27T10:00:00-03:00',
    dataAberturaProposta: null,
    dataEncerramentoProposta: '2026-10-10T09:00:00-03:00',
    linkSistemaOrigem: null,
  };
}

const item = (n: number, descricao: string, temResultado: boolean): ItemPncp => ({
  numeroItem: n,
  descricao,
  materialOuServico: 'M',
  quantidade: 10,
  unidadeMedida: 'kg',
  valorUnitarioEstimado: 5,
  valorTotal: 50,
  situacaoCompraItem: 1,
  temResultado,
});

const resultadoPf: ResultadoPncp = {
  sequencialResultado: 1,
  niFornecedor: '12345678909',
  tipoPessoa: 'PF',
  nomeRazaoSocialFornecedor: 'José',
  quantidadeHomologada: 10,
  valorUnitarioHomologado: 4.5,
  valorTotalHomologado: 45,
  dataResultado: null,
};

/** Dublê completo do cliente PNCP: implementa TODOS os métodos (o tipo obriga). */
function pncpFalso(
  paginas: ContratacaoPncp[][],
  opcoes: { itensQuebram?: string } = {},
): ClientePncp & { chamadasItens: string[] } {
  const chamadasItens: string[] = [];
  return {
    chamadasItens,
    async contratacoesPublicadas(_f, pagina = 1) {
      return {
        contratacoes: paginas[pagina - 1] ?? [],
        numeroPagina: pagina,
        totalPaginas: paginas.length,
        totalRegistros: paginas.flat().length,
      };
    },
    async *todasContratacoesPublicadas() {
      for (let i = 0; i < paginas.length; i++) {
        yield {
          contratacoes: paginas[i] ?? [],
          numeroPagina: i + 1,
          totalPaginas: paginas.length,
          totalRegistros: paginas.flat().length,
        };
      }
    },
    async itens(ref) {
      const id = `${ref.cnpj}/${ref.ano}/${ref.sequencial}`;
      chamadasItens.push(id);
      if (opcoes.itensQuebram === id) throw new Error('PNCP respondeu 500');
      return [item(1, 'Arroz tipo 1', true), item(2, 'Sabão em pó', false)];
    },
    async resultados() {
      return [resultadoPf];
    },
  };
}

function repoMemoria(pendentes: Awaited<ReturnType<Repositorio['pendentesDeResultado']>> = []) {
  const gravado = {
    contratacoes: [] as string[],
    itens: 0,
    resultados: [] as { fornecedor_documento: string | null }[],
    revisitadas: [] as string[],
  };
  const repo: Repositorio = {
    async salvarContratacao(c, itens, resultados) {
      gravado.contratacoes.push(c.numero_controle_pncp);
      gravado.itens += itens.length;
      gravado.resultados.push(...resultados);
    },
    async salvarResultadosRevisita(_n, _itens, resultados) {
      gravado.resultados.push(...resultados);
    },
    async pendentesDeResultado() {
      return pendentes;
    },
    async marcarRevisitada(n) {
      gravado.revisitadas.push(n);
    },
    async iniciarLog() {
      return 1;
    },
    async terminarLog() {},
  };
  return { repo, gravado };
}

const opcoes = {
  ufs: ['PB'],
  modalidades: [6],
  dias: 2,
  revisitar: 10,
  agora: new Date('2026-09-28T12:00:00Z'),
};

describe('coletor PNCP', () => {
  it('grava só contratações de alimentos, com itens e resultados', async () => {
    const pncp = pncpFalso([
      [contratacao(1, 'Aquisição de gêneros alimentícios'), contratacao(2, 'Aquisição de pneus')],
      [contratacao(3, 'Merenda escolar')],
    ]);
    const { repo, gravado } = repoMemoria();
    const r = await coletar(pncp, repo, opcoes, novoResumo());
    expect(r.paginasLidas).toBe(2);
    expect(r.contratacoesVistas).toBe(3);
    expect(gravado.contratacoes).toHaveLength(2);
    expect(pncp.chamadasItens).not.toContain('08944246000137/2026/2');
    expect(gravado.itens).toBe(4);
  });

  it('CPF de fornecedor pessoa física chega mascarado ao repositório', async () => {
    const { repo, gravado } = repoMemoria();
    await coletar(
      pncpFalso([[contratacao(1, 'Gêneros alimentícios')]]),
      repo,
      opcoes,
      novoResumo(),
    );
    expect(gravado.resultados[0]?.fornecedor_documento).toBe('***.456.789-**');
  });

  it('erro numa contratação não derruba as outras', async () => {
    const pncp = pncpFalso([[contratacao(1, 'Merenda'), contratacao(2, 'Merenda')]], {
      itensQuebram: '08944246000137/2026/1',
    });
    const { repo, gravado } = repoMemoria();
    const r = await coletar(pncp, repo, opcoes, novoResumo());
    expect(gravado.contratacoes).toHaveLength(1);
    expect(r.erros).toHaveLength(1);
    expect(r.erros[0]).toContain('500');
  });

  it('revisita encerradas para capturar preço homologado', async () => {
    const { repo, gravado } = repoMemoria([
      {
        numero_controle_pncp: 'x-1',
        orgao_cnpj: '08944246000137',
        ano_compra: 2026,
        sequencial_compra: 9,
        objeto: 'Merenda',
        termos_casados: ['merenda'],
      },
    ]);
    const r = await coletar(pncpFalso([]), repo, opcoes, novoResumo());
    expect(r.revisitadas).toBe(1);
    expect(gravado.revisitadas).toEqual(['x-1']);
    expect(gravado.resultados).toHaveLength(1);
  });
});
