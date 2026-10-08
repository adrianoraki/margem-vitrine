import { describe, expect, it } from 'vitest';
import { criarClienteSupabasePublico, ehChaveDeServico } from '../src/supabase';

const jwt = (role: string) =>
  [
    'eyJhbGciOiJIUzI1NiJ9',
    Buffer.from(JSON.stringify({ role })).toString('base64url'),
    'assinatura',
  ].join('.');

describe('chaves do Supabase', () => {
  it('reconhece chave de serviço nos dois formatos', () => {
    expect(ehChaveDeServico(jwt('service_role'))).toBe(true);
    expect(ehChaveDeServico('sb_secret_abc')).toBe(true);
    expect(ehChaveDeServico(jwt('anon'))).toBe(false);
    expect(ehChaveDeServico('sb_publishable_abc')).toBe(false);
  });
  it('cliente público recusa chave de serviço', () => {
    expect(() => criarClienteSupabasePublico('https://x.supabase.co', jwt('service_role'))).toThrow(
      /serviço/,
    );
    expect(() => criarClienteSupabasePublico('https://x.supabase.co', jwt('anon'))).not.toThrow();
  });
});
