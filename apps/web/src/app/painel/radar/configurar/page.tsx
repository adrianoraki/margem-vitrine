import { UFS_NORDESTE } from '@margem/core/pncp';
import { Card } from '@margem/ui';
import type { Metadata } from 'next';
import { sessaoComEmpresa } from '@/lib/sessao';
import { rotuloCategoria, rotuloTermo } from '@/lib/termos';
import { FormularioRadar } from './formulario';

export const metadata: Metadata = { title: 'Configurar radar — Margem', robots: { index: false } };

export default async function ConfigurarRadar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { sb, regra } = await sessaoComEmpresa();
  const { uf } = await searchParams;
  const { data } = await sb
    .schema('licita')
    .from('catalogo_termos')
    .select('termo, categoria')
    .order('id');

  const grupos = new Map<string, { termo: string; rotulo: string }[]>();
  for (const t of data ?? []) {
    const g = grupos.get(t.categoria) ?? [];
    g.push({ termo: t.termo, rotulo: rotuloTermo(t.termo) });
    grupos.set(t.categoria, g);
  }
  const ufInicial = uf && (UFS_NORDESTE as readonly string[]).includes(uf) ? [uf] : [];

  return (
    <div className="max-w-3xl">
      <p className="text-caption text-text-secondary font-semibold">
        {regra ? 'Radar' : 'Passo 2 de 2'}
      </p>
      <h1 className="text-h1 mt-1 font-bold tracking-tight">O que você vende, e onde?</h1>
      <p className="text-body text-text-secondary mt-2">
        O radar mostra as licitações abertas que pedem esses itens, nos estados escolhidos. Dá para
        mudar quando quiser.
      </p>
      <Card className="mt-6">
        <FormularioRadar
          grupos={[...grupos].map(([categoria, termos]) => ({
            categoria: rotuloCategoria(categoria),
            termos,
          }))}
          ufs={[...UFS_NORDESTE]}
          inicial={{ termos: regra?.termos ?? [], ufs: regra?.ufs ?? ufInicial }}
        />
      </Card>
    </div>
  );
}
