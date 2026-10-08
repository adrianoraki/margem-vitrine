import { describe, expect, it, vi } from 'vitest';
import { criarClientePncp, dataParaPncp, ErroPncp } from '../src/pncp/cliente';
import { paraLinhaContratacao, paraLinhaResultado } from '../src/pncp/mapear';
import { contratacaoPncpSchema, resultadoPncpSchema } from '../src/pncp/schemas';
import { contratacaoPb, itemArroz, resultadoPf, resultadoPj } from './fixtures/pncp';

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status });
}
const pagina = (data: unknown[], numeroPagina: number, totalPaginas: number) => ({
  data,
  totalRegistros: data.length,
  totalPaginas,
  numeroPagina,
  paginasRestantes: totalPaginas - numeroPagina,
  empty: data.length === 0,
});

describe('schemas do PNCP', () => {
  it('valida contratação real e ignora campos extras', () => {
    const c = contratacaoPncpSchema.parse(contratacaoPb);
    expect(c.orgaoEntidade.cnpj).toBe('08944246000137');
    // Horário de Brasília sem fuso ganha -03:00.
    expect(c.dataEncerramentoProposta).toBe('2026-08-15T09:00:00-03:00');
    expect(c.valorTotalHomologado).toBeNull();
  });
  it('aceita número como string', () => {
    const r = resultadoPncpSchema.parse({ ...resultadoPj, valorUnitarioHomologado: '76,62' });
    expect(r.valorUnitarioHomologado).toBe(76.62);
  });
  it('recusa contratação sem CNPJ do órgão', () => {
    const r = contratacaoPncpSchema.safeParse({
      ...contratacaoPb,
      orgaoEntidade: { razaoSocial: 'x' },
    });
    expect(r.success).toBe(false);
  });
});

describe('mapeamento para o banco', () => {
  it('contratação vira linha com UF e termos', () => {
    const l = paraLinhaContratacao(contratacaoPncpSchema.parse(contratacaoPb), ['merenda']);
    expect(l).toMatchObject({
      uf: 'PB',
      modalidade_id: 6,
      municipio: 'Patos',
      termos_casados: ['merenda'],
    });
  });
  it('resultado PF sai com CPF mascarado, PJ com CNPJ inteiro', () => {
    const pf = paraLinhaResultado('x', 1, resultadoPncpSchema.parse(resultadoPf), 0);
    const pj = paraLinhaResultado('x', 1, resultadoPncpSchema.parse(resultadoPj), 0);
    expect(pf.fornecedor_documento).toBe('***.456.789-**');
    expect(pj.fornecedor_documento).toBe('12345678000195');
    expect(pj.valor_unitario_homologado).toBe(76.62);
  });
});

describe('cliente do PNCP', () => {
  it('formata a data no fuso de Brasília', () => {
    // 02:00 UTC do dia 2 ainda é dia 1 em Brasília.
    expect(dataParaPncp(new Date('2026-08-02T02:00:00Z'))).toBe('20260801');
  });

  it('monta a URL com os filtros e percorre as páginas', async () => {
    const f = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(resposta(200, pagina([contratacaoPb], 1, 2)))
      .mockResolvedValueOnce(resposta(200, pagina([contratacaoPb], 2, 2)));
    const pncp = criarClientePncp({ fetch: f, esperaBaseMs: 0 });
    const paginas = [];
    for await (const p of pncp.todasContratacoesPublicadas({
      dataInicial: new Date('2026-08-01T12:00:00Z'),
      dataFinal: new Date('2026-08-02T12:00:00Z'),
      modalidade: 6,
      uf: 'PB',
    })) {
      paginas.push(p);
    }
    expect(paginas).toHaveLength(2);
    const url = new URL(String(f.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/api/consulta/v1/contratacoes/publicacao');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      dataInicial: '20260801',
      dataFinal: '20260802',
      codigoModalidadeContratacao: '6',
      uf: 'PB',
      pagina: '1',
    });
  });

  it('204 do PNCP é página vazia, não erro', async () => {
    const pncp = criarClientePncp({
      fetch: vi.fn<typeof fetch>().mockResolvedValue(resposta(204)),
      esperaBaseMs: 0,
    });
    const p = await pncp.contratacoesPublicadas({
      dataInicial: new Date(),
      dataFinal: new Date(),
      modalidade: 8,
    });
    expect(p.contratacoes).toEqual([]);
  });

  it('tenta de novo em 429 e 5xx, desiste em 4xx', async () => {
    const f = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(resposta(429))
      .mockResolvedValueOnce(resposta(503))
      .mockResolvedValueOnce(resposta(200, [itemArroz]));
    const pncp = criarClientePncp({ fetch: f, esperaBaseMs: 0 });
    expect(await pncp.itens({ cnpj: '08944246000137', ano: 2026, sequencial: 45 })).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(3);

    const g = vi.fn<typeof fetch>().mockResolvedValue(resposta(400));
    await expect(
      criarClientePncp({ fetch: g, esperaBaseMs: 0 }).resultados(
        { cnpj: 'x', ano: 1, sequencial: 1 },
        1,
      ),
    ).rejects.toBeInstanceOf(ErroPncp);
    expect(g).toHaveBeenCalledTimes(1);
  });

  it('registro inválido é descartado e reportado, sem derrubar a página', async () => {
    const invalidos: string[] = [];
    const f = vi
      .fn<typeof fetch>()
      .mockResolvedValue(resposta(200, pagina([contratacaoPb, { lixo: true }], 1, 1)));
    const pncp = criarClientePncp({
      fetch: f,
      esperaBaseMs: 0,
      aoRegistroInvalido: (r) => invalidos.push(r.erro),
    });
    const p = await pncp.contratacoesPublicadas({
      dataInicial: new Date(),
      dataFinal: new Date(),
      modalidade: 6,
    });
    expect(p.contratacoes).toHaveLength(1);
    expect(invalidos).toHaveLength(1);
  });
});
