// Edge Function: recebe o certificado A1 do cliente (RF-20) e guarda no Supabase Vault.
//
// Regras (docs/adr/0005-certificado-a1-no-vault.md):
// - O navegador envia o .pfx e a senha DIRETO para esta função (multipart). O site nunca guarda,
//   lê de volta nem recebe o certificado depois.
// - Senha e arquivo nunca aparecem em log, erro ou resposta.
// - Só o dono da organização envia (RF-03). Limite de taxa por usuário.
// - A service role só existe aqui dentro (variável de ambiente da função), nunca no cliente.
import { createClient } from '@supabase/supabase-js';
import { cabecalhosCors } from '../_compartilhado/cors.ts';
import { ErroCertificado, lerCertificado, type DadosCertificado } from './certificado.ts';

const TAMANHO_MAXIMO = 50 * 1024; // um A1 tem poucos KB

function resposta(status: number, corpo: Record<string, unknown>, cors: HeadersInit): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function variavel(nome: string): string {
  const v = Deno.env.get(nome);
  if (!v) throw new Error(`variável ${nome} ausente`);
  return v;
}

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return resposta(405, { erro: 'Método não permitido.' }, cors);

  const url = variavel('SUPABASE_URL');
  const anon = variavel('SUPABASE_ANON_KEY');
  const servico = variavel('SUPABASE_SERVICE_ROLE_KEY');

  // 1. Quem é o usuário (JWT do próprio Supabase Auth).
  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: usuario } = await comoUsuario.auth.getUser();
  if (!usuario.user) return resposta(401, { erro: 'Faça login de novo.' }, cors);

  const admin = createClient(url, servico, { auth: { persistSession: false } });

  // 2. Limite de taxa: 5 tentativas a cada 10 minutos por usuário (senha errada repetida inclusive).
  const chave = await sha256(`certificado:${usuario.user.id}`);
  const { data: permitido } = await admin.schema('core').rpc('consumir_limite', {
    p_chave: chave,
    p_limite: 5,
    p_janela_segundos: 600,
  });
  if (permitido !== true)
    return resposta(429, { erro: 'Muitas tentativas. Aguarde alguns minutos.' }, cors);

  // 3. Entrada.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return resposta(400, { erro: 'Envio inválido.' }, cors);
  }
  const organizacao = form.get('organizacao_id');
  const arquivo = form.get('certificado');
  const senha = form.get('senha');
  if (typeof organizacao !== 'string' || !/^[0-9a-f-]{36}$/.test(organizacao)) {
    return resposta(400, { erro: 'Organização inválida.' }, cors);
  }
  if (!(arquivo instanceof File) || arquivo.size === 0 || arquivo.size > TAMANHO_MAXIMO) {
    return resposta(400, { erro: 'Envie o arquivo .pfx do certificado A1.' }, cors);
  }
  if (typeof senha !== 'string' || senha.length === 0 || senha.length > 256) {
    return resposta(400, { erro: 'Informe a senha do certificado.' }, cors);
  }

  // 4. Só o dono. A checagem roda com a identidade do usuário, então a RLS vale.
  const { data: ehDono } = await comoUsuario
    .schema('core')
    .rpc('eh_dono', { p_organizacao: organizacao });
  if (ehDono !== true)
    return resposta(403, { erro: 'Só o dono da conta pode enviar o certificado.' }, cors);

  const { data: org } = await admin
    .schema('core')
    .from('organizacoes')
    .select('cnpj')
    .eq('id', organizacao)
    .single();

  // 5. Validação imediata: abre, confere validade e CNPJ.
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  let dados: DadosCertificado;
  try {
    dados = lerCertificado(bytes, senha);
  } catch (e) {
    const msg =
      e instanceof ErroCertificado ? e.message : 'Não foi possível validar o certificado.';
    return resposta(422, { erro: msg }, cors);
  }
  if (dados.validoAte <= new Date())
    return resposta(422, { erro: 'Este certificado está vencido.' }, cors);
  if (dados.tipo === 'e-CPF') {
    return resposta(
      422,
      { erro: 'Envie o e-CNPJ da empresa. A consulta de notas na Receita é feita pelo CNPJ.' },
      cors,
    );
  }
  // Mesma raiz de CNPJ (8 primeiros dígitos): o certificado da matriz serve às filiais.
  const cnpjOrg = (org as { cnpj: string | null } | null)?.cnpj;
  if (!cnpjOrg || dados.documento.slice(0, 8) !== cnpjOrg.slice(0, 8)) {
    return resposta(422, { erro: 'O CNPJ do certificado não é o da sua empresa.' }, cors);
  }

  // 6. Cofre. Base64 porque o Vault guarda texto.
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  const { data: id, error } = await admin.schema('compras').rpc('salvar_certificado', {
    p_organizacao: organizacao,
    p_cnpj: dados.documento,
    p_titular: dados.titular,
    p_tipo: dados.tipo,
    p_valido_de: dados.validoDe.toISOString(),
    p_valido_ate: dados.validoAte.toISOString(),
    p_pfx_base64: btoa(binario),
    p_senha: senha,
    p_enviado_por: usuario.user.id,
  });
  if (error) {
    // Só o código: a mensagem do Postgres poderia ecoar parâmetros.
    console.error('salvar_certificado falhou', error.code);
    return resposta(500, { erro: 'Não conseguimos guardar o certificado. Tente de novo.' }, cors);
  }

  return resposta(
    201,
    { id, titular: dados.titular, cnpj: dados.documento, validoAte: dados.validoAte.toISOString() },
    cors,
  );
});
