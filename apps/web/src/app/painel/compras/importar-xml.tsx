'use client';

import { formatarMoeda } from '@margem/core';
import { Botao, cn } from '@margem/ui';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { importarXml, type ResultadoXml } from './acoes';

type Linha = { nome: string; r?: ResultadoXml };

const MAXIMO_POR_VEZ = 200;

/** Envio de XMLs de NF-e: vários de uma vez, gravados um a um, com o resultado de cada arquivo. */
export function ImportarXml() {
  const entrada = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const router = useRouter();

  async function enviar(lista: FileList | File[]) {
    const arquivos = [...lista]
      .filter((f) => f.name.toLowerCase().endsWith('.xml'))
      .slice(0, MAXIMO_POR_VEZ);
    if (!arquivos.length) {
      setLinhas([
        { nome: 'Nenhum arquivo .xml', r: { ok: false, erro: 'Escolha arquivos .xml de NF-e.' } },
      ]);
      return;
    }
    setEnviando(true);
    setLinhas(arquivos.map((f) => ({ nome: f.name })));
    for (const [i, f] of arquivos.entries()) {
      const form = new FormData();
      form.set('arquivo', f);
      let r: ResultadoXml;
      try {
        r = await importarXml(form);
      } catch {
        r = { ok: false, erro: 'Falha de conexão. Tente de novo.' };
      }
      setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, r } : l)));
    }
    setEnviando(false);
    if (entrada.current) entrada.current.value = '';
    router.refresh();
  }

  const novas = linhas.filter((l) => l.r?.ok && l.r.nova).length;
  const repetidas = linhas.filter((l) => l.r?.ok && !l.r.nova).length;
  const erros = linhas.filter((l) => l.r && !l.r.ok).length;

  return (
    <div>
      <label
        htmlFor="xmls"
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          if (!enviando) void enviar(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-card border-border flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors',
          arrastando ? 'border-accent bg-accent-soft' : 'hover:bg-bg',
          enviando && 'pointer-events-none opacity-60',
        )}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="text-text-secondary size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-body font-medium">Arraste os XML das notas aqui</span>
        <span className="text-small text-text-secondary">
          ou clique para escolher. Até {MAXIMO_POR_VEZ} arquivos por vez; nota repetida não duplica.
        </span>
        <input
          ref={entrada}
          id="xmls"
          type="file"
          accept=".xml,text/xml,application/xml"
          multiple
          className="sr-only"
          disabled={enviando}
          onChange={(e) => e.target.files && void enviar(e.target.files)}
        />
      </label>

      {linhas.length > 0 && (
        <div className="mt-4" role="status" aria-live="polite">
          <p className="text-small font-medium">
            {enviando
              ? `Importando ${linhas.filter((l) => l.r).length} de ${linhas.length}…`
              : `${novas} importada(s)${repetidas ? `, ${repetidas} já existia(m)` : ''}${erros ? `, ${erros} com erro` : ''}.`}
          </p>
          <ul className="divide-border border-border rounded-card mt-2 max-h-64 divide-y overflow-y-auto border">
            {linhas.map((l, i) => (
              <li
                key={`${l.nome}-${i}`}
                className="text-small flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 truncate">{l.nome}</span>
                {!l.r ? (
                  <span className="text-text-secondary shrink-0">…</span>
                ) : l.r.ok ? (
                  <span
                    className={cn('shrink-0', l.r.nova ? 'text-accent' : 'text-text-secondary')}
                  >
                    {l.r.nova
                      ? `${l.r.fornecedor} · ${l.r.itens} itens · ${formatarMoeda(l.r.valor)}`
                      : 'Já importada'}
                  </span>
                ) : (
                  <span className="text-critical shrink-0 text-right">{l.r.erro}</span>
                )}
              </li>
            ))}
          </ul>
          {!enviando && (
            <Botao variante="texto" className="mt-2 h-8 px-2 md:h-8" onClick={() => setLinhas([])}>
              Limpar lista
            </Botao>
          )}
        </div>
      )}
    </div>
  );
}
