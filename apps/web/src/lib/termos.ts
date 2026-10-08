// Os termos do catálogo ficam normalizados no banco (sem acento, para casar texto do PNCP).
// Aqui é só a grafia de exibição.
const ROTULOS: Record<string, string> = {
  'generos alimenticios': 'Gêneros alimentícios',
  'alimentacao escolar': 'Alimentação escolar',
  feijao: 'Feijão',
  macarrao: 'Macarrão',
  fuba: 'Fubá',
  acucar: 'Açúcar',
  cafe: 'Café',
  'oleo de soja': 'Óleo de soja',
  pao: 'Pão',
};

const CATEGORIAS: Record<string, string> = {
  geral: 'Geral',
  merenda: 'Merenda',
  graos: 'Grãos e farinhas',
  mercearia: 'Mercearia',
  laticinios: 'Laticínios',
  carnes: 'Carnes e ovos',
  hortifruti: 'Hortifrúti',
  panificacao: 'Panificação',
};

/**
 * Grafia de exibição de um termo do catálogo ("feijao" → "Feijão").
 * @param termo Termo normalizado, como está em licita.catalogo_termos.
 */
export function rotuloTermo(termo: string): string {
  return ROTULOS[termo] ?? termo.charAt(0).toUpperCase() + termo.slice(1);
}

/**
 * Nome de exibição de uma categoria do catálogo.
 * @param categoria Código da categoria.
 */
export function rotuloCategoria(categoria: string): string {
  return CATEGORIAS[categoria] ?? rotuloTermo(categoria);
}
