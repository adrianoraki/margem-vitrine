'use client';

import { formatarCnpj, limparCnpj, validarCnpj } from '@margem/core';
import { Botao, Entrada } from '@margem/ui';
import { useActionState, useState, type ReactNode } from 'react';
import { buscarCnpj, salvarEmpresa, type EstadoEmpresa } from './acoes';

const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
];

interface Valores {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  uf: string;
  municipio: string;
  cnae?: string;
}

interface Props {
  inicial: Valores | null;
  podeEditar: boolean;
}

/** Passo 1: CNPJ com busca automática na Receita (BrasilAPI) e preenchimento manual de reserva. */
export function FormularioEmpresa({ inicial, podeEditar }: Props) {
  const existe = inicial !== null;
  const [v, setV] = useState<Valores>(
    inicial ?? { cnpj: '', razaoSocial: '', nomeFantasia: '', uf: '', municipio: '', cnae: '' },
  );
  const [aviso, setAviso] = useState<string>();
  const [buscando, setBuscando] = useState(false);
  const [estado, enviar, salvando] = useActionState<EstadoEmpresa, FormData>(salvarEmpresa, {});

  const campo = (k: keyof Valores) => ({
    id: k,
    name: k,
    value: v[k] ?? '',
    onChange: (e: { target: { value: string } }) => setV((a) => ({ ...a, [k]: e.target.value })),
    invalido: Boolean(estado.campos?.[k]),
    'aria-describedby': estado.campos?.[k] ? `${k}-erro` : undefined,
    disabled: !podeEditar || salvando,
  });

  async function aoMudarCnpj(texto: string) {
    const digitos = limparCnpj(texto).slice(0, 14);
    setV((a) => ({ ...a, cnpj: digitos.length === 14 ? formatarCnpj(digitos) : digitos }));
    setAviso(undefined);
    if (digitos.length !== 14) return;
    if (!validarCnpj(digitos)) {
      setAviso('CNPJ inválido. Confira os dígitos.');
      return;
    }
    setBuscando(true);
    const r = await buscarCnpj(digitos);
    setBuscando(false);
    if (!r.ok) return setAviso(r.erro);
    if (!r.dados) {
      setAviso('Não achamos este CNPJ na Receita. Preencha os dados abaixo.');
      return;
    }
    const d = r.dados;
    setV((a) => ({
      ...a,
      razaoSocial: d.razaoSocial,
      nomeFantasia: d.nomeFantasia ?? '',
      uf: d.uf ?? '',
      municipio: d.municipio ?? '',
      cnae: d.cnae ?? '',
    }));
    setAviso('Dados encontrados na Receita. Confira e salve.');
  }

  return (
    <form action={enviar} noValidate className="grid gap-5">
      <Campo rotulo="CNPJ" id="cnpj" erro={estado.campos?.cnpj}>
        <Entrada
          {...campo('cnpj')}
          inputMode="numeric"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          readOnly={existe}
          disabled={existe || salvando}
          onChange={(e) => void aoMudarCnpj(e.target.value)}
          className="numeros"
        />
        {existe && <input type="hidden" name="cnpj" value={v.cnpj} />}
        {(buscando || aviso) && (
          <p className="text-small text-text-secondary" role="status">
            {buscando ? 'Buscando na Receita…' : aviso}
          </p>
        )}
      </Campo>
      <Campo rotulo="Razão social" id="razaoSocial" erro={estado.campos?.razaoSocial}>
        <Entrada {...campo('razaoSocial')} autoComplete="organization" />
      </Campo>
      <Campo rotulo="Nome fantasia (opcional)" id="nomeFantasia">
        <Entrada {...campo('nomeFantasia')} />
      </Campo>
      <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
        <Campo rotulo="UF" id="uf" erro={estado.campos?.uf}>
          <select
            id="uf"
            name="uf"
            value={v.uf}
            onChange={(e) => setV((a) => ({ ...a, uf: e.target.value }))}
            disabled={!podeEditar || salvando}
            className="rounded-input border-border bg-surface text-body h-12 w-full border px-3 md:h-11"
          >
            <option value="">—</option>
            {UFS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Município (opcional)" id="municipio">
          <Entrada {...campo('municipio')} autoComplete="address-level2" />
        </Campo>
      </div>
      <input type="hidden" name="cnae" value={v.cnae ?? ''} />

      {estado.erro && (
        <p role="alert" className="text-small text-critical">
          {estado.erro}
        </p>
      )}
      {estado.ok && !salvando && (
        <p role="status" className="text-small text-accent">
          Dados salvos.
        </p>
      )}
      {podeEditar ? (
        <Botao type="submit" className="justify-self-start" disabled={salvando || buscando}>
          {salvando ? 'Salvando…' : existe ? 'Salvar alterações' : 'Continuar →'}
        </Botao>
      ) : (
        <p className="text-small text-text-secondary">Só o dono da conta altera estes dados.</p>
      )}
    </form>
  );
}

function Campo({
  rotulo,
  id,
  erro,
  children,
}: {
  rotulo: string;
  id: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-small font-medium">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="text-small text-critical">
          {erro}
        </p>
      )}
    </div>
  );
}
