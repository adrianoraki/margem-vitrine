'use client';

import { Botao, Chip } from '@margem/ui';
import { useActionState, useState } from 'react';
import { salvarRadar, type EstadoRadar } from '../acoes';

interface Props {
  grupos: { categoria: string; termos: { termo: string; rotulo: string }[] }[];
  ufs: string[];
  inicial: { termos: string[]; ufs: string[] };
}

/** Escolha de itens (catálogo) e UFs do radar, com chips. Sem UF marcada vale o Nordeste todo. */
export function FormularioRadar({ grupos, ufs, inicial }: Props) {
  const [termos, setTermos] = useState(new Set(inicial.termos));
  const [estados, setEstados] = useState(new Set(inicial.ufs));
  const [estado, enviar, salvando] = useActionState<EstadoRadar, FormData>(salvarRadar, {});

  const alternar = (s: Set<string>, set: (s: Set<string>) => void, v: string, sim: boolean) => {
    const n = new Set(s);
    if (sim) n.add(v);
    else n.delete(v);
    set(n);
  };
  const todos = grupos.flatMap((g) => g.termos.map((t) => t.termo));

  return (
    <form action={enviar} className="grid gap-8">
      <fieldset className="grid gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <legend className="text-h3">Itens</legend>
          <Botao
            type="button"
            variante="texto"
            className="h-8 px-2 md:h-8"
            onClick={() => setTermos(termos.size === todos.length ? new Set() : new Set(todos))}
          >
            {termos.size === todos.length ? 'Limpar' : 'Marcar todos'}
          </Botao>
        </div>
        {grupos.map((g) => (
          <div key={g.categoria}>
            <p className="text-caption text-text-secondary mb-2 font-semibold">{g.categoria}</p>
            <div className="flex flex-wrap gap-2">
              {g.termos.map((t) => (
                <Chip
                  key={t.termo}
                  selecionado={termos.has(t.termo)}
                  onChange={(sim) => alternar(termos, setTermos, t.termo, sim)}
                  disabled={salvando}
                >
                  {t.rotulo}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-h3">Estados</legend>
        <p className="text-small text-text-secondary">
          {estados.size
            ? `${estados.size} selecionado(s).`
            : 'Nenhum marcado: vale o Nordeste inteiro.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {ufs.map((u) => (
            <Chip
              key={u}
              selecionado={estados.has(u)}
              onChange={(sim) => alternar(estados, setEstados, u, sim)}
              disabled={salvando}
            >
              {u}
            </Chip>
          ))}
        </div>
      </fieldset>

      {[...termos].map((t) => (
        <input key={t} type="hidden" name="termos" value={t} />
      ))}
      {[...estados].map((u) => (
        <input key={u} type="hidden" name="ufs" value={u} />
      ))}

      {estado.erro && (
        <p role="alert" className="text-small text-critical">
          {estado.erro}
        </p>
      )}
      <Botao type="submit" className="justify-self-start" disabled={salvando || termos.size === 0}>
        {salvando ? 'Salvando…' : 'Salvar e ver o radar →'}
      </Botao>
    </form>
  );
}
