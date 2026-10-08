/** Códigos de modalidade de contratação do PNCP (tabela de domínio do Manual de Integração). */
export const MODALIDADES = {
  leilaoEletronico: 1,
  dialogoCompetitivo: 2,
  concurso: 3,
  concorrenciaEletronica: 4,
  concorrenciaPresencial: 5,
  pregaoEletronico: 6,
  pregaoPresencial: 7,
  dispensa: 8,
  inexigibilidade: 9,
  manifestacaoInteresse: 10,
  preQualificacao: 11,
  credenciamento: 12,
  leilaoPresencial: 13,
} as const;

/** Modalidades coletadas no MVP: onde está o volume de alimentos (doc, teste técnico de 28/09/2026). */
export const MODALIDADES_COLETADAS = [MODALIDADES.pregaoEletronico, MODALIDADES.dispensa] as const;

/** UFs do Nordeste. O MVP começa na Paraíba e expande sem mudar o esquema. */
export const UFS_NORDESTE = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] as const;
