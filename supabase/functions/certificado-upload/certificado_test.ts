// @ts-types="npm:@types/node-forge@1.3.11"
import forge from 'node-forge';
import { ErroCertificado, lerCertificado } from './certificado.ts';

// Gera um .pfx descartável em memória (nenhum certificado real no repositório).
function gerarPfx(cn: string, senha: string, validoAte: Date): Uint8Array {
  const chaves = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = chaves.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(Date.now() - 86_400_000);
  cert.validity.notAfter = validoAte;
  cert.setSubject([{ name: 'commonName', value: cn }]);
  cert.setIssuer([{ name: 'commonName', value: 'AC Teste' }]);
  cert.sign(chaves.privateKey);
  const asn1 = forge.pkcs12.toPkcs12Asn1(chaves.privateKey, [cert], senha, { algorithm: '3des' });
  return forge.util.binary.raw.decode(forge.asn1.toDer(asn1).getBytes());
}

function afirmar(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const umAno = new Date(Date.now() + 365 * 86_400_000);

Deno.test('lê titular, CNPJ e validade de um e-CNPJ', () => {
  const d = lerCertificado(
    gerarPfx('DISTRIBUIDORA TESTE LTDA:11222333000181', 'segredo', umAno),
    'segredo',
  );
  afirmar(d.tipo === 'e-CNPJ', 'tipo');
  afirmar(d.documento === '11222333000181', 'documento');
  afirmar(d.titular === 'DISTRIBUIDORA TESTE LTDA', 'titular');
});

Deno.test('reconhece e-CPF', () => {
  const d = lerCertificado(gerarPfx('FULANO DE TAL:12345678909', 's', umAno), 's');
  afirmar(d.tipo === 'e-CPF', 'tipo');
});

Deno.test('senha errada vira erro neutro, sem ecoar a senha', () => {
  try {
    lerCertificado(gerarPfx('X:11222333000181', 'certa', umAno), 'errada-123');
    throw new Error('deveria falhar');
  } catch (e) {
    afirmar(e instanceof ErroCertificado, 'tipo do erro');
    afirmar(!(e as Error).message.includes('errada-123'), 'senha vazou na mensagem');
  }
});

Deno.test('certificado sem documento é recusado', () => {
  let falhou = false;
  try {
    lerCertificado(gerarPfx('SEM DOCUMENTO', 's', umAno), 's');
  } catch (e) {
    falhou = e instanceof ErroCertificado;
  }
  afirmar(falhou, 'deveria recusar');
});
