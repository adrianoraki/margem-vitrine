import { describe, expect, it } from 'vitest';
import { destinoSeguro } from '@/lib/redirecionamento';
import { capitalizarNome, limparObjeto, moedaCompacta, nomeItem, prazoAte } from '@/lib/texto';
import { ehPrecoDeVitrine } from '@/lib/vitrine-filtro';

describe('texto da vitrine', () => {
  it('tira prefixo de portal e desfaz caixa alta', () => {
    expect(limparObjeto('[Portal de Compras Públicas] - Registro de preços para cestas')).toBe(
      'Registro de preços para cestas',
    );
    expect(limparObjeto('AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS')).toBe(
      'Aquisição de gêneros alimentícios',
    );
    expect(limparObjeto('aquisição de Arroz')).toBe('Aquisição de Arroz');
  });
  it('capitaliza nome de órgão', () => {
    expect(capitalizarNome('MUNICIPIO DE RIACHAO DO BACAMARTE')).toBe(
      'Município de Riachao do Bacamarte',
    );
  });
  it('moeda compacta', () => {
    expect(moedaCompacta(1_050_390)).toBe('R$ 1,1 mi');
    expect(moedaCompacta(732_106.2)).toBe('R$ 732,1 mil');
  });
  it('prazo com urgência abaixo de 48 h', () => {
    const agora = new Date('2026-09-28T12:00:00Z');
    expect(prazoAte('2026-09-28T20:00:00Z', agora)).toEqual({
      texto: 'encerra em 8 h',
      urgente: true,
    });
    expect(prazoAte('2026-09-29T20:00:00Z', agora)).toEqual({ texto: 'em 1 dia', urgente: true });
    expect(prazoAte('2026-10-06T12:00:00Z', agora)).toEqual({ texto: 'em 8 dias', urgente: false });
    expect(prazoAte('2026-09-27T12:00:00Z', agora).texto).toBe('encerrada');
  });
});

describe('destinoSeguro (open redirect)', () => {
  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', '', null, 'painel'])(
    '%s vira /painel',
    (d) => {
      expect(destinoSeguro(d)).toBe('/painel');
    },
  );
  it('aceita caminho interno', () => {
    expect(destinoSeguro('/painel/radar?x=1')).toBe('/painel/radar?x=1');
  });
});

describe('nomeOrgao', () => {
  it('município vira prefeitura, com a grafia do campo município', async () => {
    const { nomeOrgao } = await import('@/lib/texto');
    expect(nomeOrgao('MUNICIPIO DE RIACHAO DO BACAMARTE', 'Riachão do Bacamarte')).toBe(
      'Prefeitura de Riachão do Bacamarte',
    );
    expect(nomeOrgao('AUTARQUIA ESPECIAL MUNICIPAL DE LIMPEZA URBANA-EMLUR', 'João Pessoa')).toBe(
      'Autarquia Especial Municipal de Limpeza Urbana-emlur',
    );
  });
});

describe('mensagemErroEnvio', () => {
  it('distingue espera curta de cota por hora', async () => {
    const { mensagemErroEnvio } = await import('@/lib/erros-auth');
    expect(
      mensagemErroEnvio({
        status: 429,
        code: 'over_email_send_rate_limit',
        message: 'For security purposes, you can only request this after 30 seconds.',
      }),
    ).toBe('Aguarde 30 segundos para pedir outro link.');
    expect(
      mensagemErroEnvio({
        status: 429,
        code: 'over_email_send_rate_limit',
        message: 'email rate limit exceeded',
      }),
    ).toMatch(/Limite de envio/);
    expect(mensagemErroEnvio({ status: 500, message: 'boom' })).toMatch(/Não conseguimos/);
  });
});

describe('itens da vitrine', () => {
  it('nome do item vem da categoria ou do tipo, sem "tipo" solto', () => {
    expect(nomeItem('Fruta apresentação: natural, tipo: banana pacovan')).toBe('Banana pacovan');
    expect(nomeItem('Legume In Natura tipo: beterraba')).toBe('Beterraba');
    expect(nomeItem('Leguminosa tipo: tipo 1, variedade: feijão carioca')).toBe('Feijão carioca');
    expect(
      nomeItem(
        'Legume In Natura* características adicionais: a vácuo, espécie: mandioca descascada, tipo: congelada',
      ),
    ).toBe('Mandioca descascada');
    expect(nomeItem('Fruta apresentação: natural, tipo: abacaxi havaí / abacaxi cayenne')).toBe(
      'Abacaxi havaí',
    );
    expect(nomeItem('Farinha De Trigo grupo: industrial, tipo: tipo 1, especial')).toBe(
      'Farinha de trigo',
    );
    expect(nomeItem('Carne Bovina In Natura apresentação: moida, tipo corte: acém')).toBe(
      'Carne bovina',
    );
    expect(nomeItem('Pão base: de farinha de trigo refinada')).toBe('Pão');
    expect(nomeItem('ARROZ BRANCO TIPO 1, pacote 5 kg')).toBe('Arroz branco tipo 1');
  });
  it('vitrine só mostra preço de alimento, e preço plausível', () => {
    expect(ehPrecoDeVitrine('Pão base: de farinha de trigo refinada', 14)).toBe(true);
    expect(ehPrecoDeVitrine('Creme De Leite processamento: uht', 1.88)).toBe(true);
    expect(ehPrecoDeVitrine('Fruta apresentação: natural, tipo: acerola', 9.89)).toBe(true);
    expect(
      ehPrecoDeVitrine('Gás Refino De Petróleo tipo: gás liquefeito de petróleo - glp', 110),
    ).toBe(false);
    // Valores como 0,07 por kg são percentual de desconto lançado como preço.
    expect(ehPrecoDeVitrine('Fruta adicional: orgânica, tipo: melancia vermelha', 0.073)).toBe(
      false,
    );
  });
});
