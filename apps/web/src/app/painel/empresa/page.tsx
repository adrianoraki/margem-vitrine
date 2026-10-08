import { formatarCnpj } from '@margem/core';
import { Card } from '@margem/ui';
import type { Metadata } from 'next';
import { carregarSessao } from '@/lib/sessao';
import { FormularioEmpresa } from './formulario';

export const metadata: Metadata = { title: 'Empresa — Margem', robots: { index: false } };

export default async function PaginaEmpresa() {
  const { empresa, papel } = await carregarSessao();
  return (
    <div className="max-w-2xl">
      <p className="text-caption text-text-secondary font-semibold">
        {empresa ? 'Empresa' : 'Passo 1 de 2'}
      </p>
      <h1 className="text-h1 mt-1 font-bold tracking-tight">
        {empresa ? 'Dados da empresa' : 'Cadastre sua empresa'}
      </h1>
      <p className="text-body text-text-secondary mt-2">
        {empresa
          ? `CNPJ ${formatarCnpj(empresa.cnpj ?? '')}. O CNPJ não muda; os outros dados você ajusta aqui.`
          : 'Digite o CNPJ e a gente busca os dados públicos na Receita. Se não achar, é só preencher.'}
      </p>
      <Card className="mt-6">
        <FormularioEmpresa
          inicial={
            empresa
              ? {
                  cnpj: formatarCnpj(empresa.cnpj ?? ''),
                  razaoSocial: empresa.razao_social,
                  nomeFantasia: empresa.nome_fantasia ?? '',
                  uf: empresa.uf ?? '',
                  municipio: empresa.municipio ?? '',
                }
              : null
          }
          podeEditar={!empresa || papel === 'dono'}
        />
      </Card>
    </div>
  );
}
