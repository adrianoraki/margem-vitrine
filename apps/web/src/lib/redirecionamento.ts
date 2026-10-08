/**
 * Destino seguro depois do login: só caminho interno. Evita open redirect
 * (`//evil.com`, `https://evil.com`, `/\evil.com`).
 * @param destino Valor vindo da URL (`?next=`).
 */
export function destinoSeguro(destino: string | null | undefined): string {
  if (
    !destino ||
    !destino.startsWith('/') ||
    destino.startsWith('//') ||
    destino.startsWith('/\\')
  ) {
    return '/painel';
  }
  return destino;
}
