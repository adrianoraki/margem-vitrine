/**
 * Diz se a chave é de serviço (ignora RLS). Reconhece os dois formatos do Supabase:
 * as chaves novas (`sb_secret_…`) e as JWT antigas com `role: service_role`.
 * @param chave Chave do Supabase.
 */
export function ehChaveDeServico(chave: string): boolean {
  if (chave.startsWith('sb_secret_')) return true;
  if (chave.startsWith('sb_publishable_')) return false;
  const partes = chave.split('.');
  if (partes.length !== 3 || !partes[1]) return false;
  try {
    const json = atob(partes[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { role?: unknown };
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}
