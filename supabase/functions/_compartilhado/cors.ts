/** CORS só para o próprio site (SITE_URL). Nada de `*` numa função que recebe certificado. */
export function cabecalhosCors(origem: string | null): HeadersInit {
  const permitido = Deno.env.get('SITE_URL') ?? '';
  return {
    'Access-Control-Allow-Origin': origem && origem === permitido ? origem : permitido,
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}
