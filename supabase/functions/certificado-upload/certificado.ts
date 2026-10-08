// @ts-types="npm:@types/node-forge@1.3.11"
import forge from 'node-forge';

export interface DadosCertificado {
  titular: string;
  documento: string;
  tipo: 'e-CNPJ' | 'e-CPF';
  validoDe: Date;
  validoAte: Date;
}

export class ErroCertificado extends Error {}

// OID ICP-Brasil do CNPJ no SubjectAltName (otherName).
const OID_CNPJ = '2.16.76.1.3.3';

/**
 * Abre o .pfx com a senha e extrai titular, documento e validade.
 * Senha errada, arquivo corrompido ou sem certificado viram ErroCertificado com mensagem neutra.
 * Nada aqui escreve em log.
 */
export function lerCertificado(pfx: Uint8Array, senha: string): DadosCertificado {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const der = forge.util.binary.raw.encode(pfx);
    p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(der), senha);
  } catch {
    throw new ErroCertificado('Não foi possível abrir o certificado. Confira o arquivo e a senha.');
  }

  const bolsas = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
  // O certificado do titular é o que não é autoridade certificadora.
  const cert = bolsas
    .map((b) => b.cert)
    .find((c) => c && !(c.getExtension('basicConstraints') as { cA?: boolean } | undefined)?.cA);
  if (!cert) throw new ErroCertificado('O arquivo não contém um certificado de titular.');

  const cn = String(cert.subject.getField('CN')?.value ?? '');
  // Padrão ICP-Brasil: "RAZAO SOCIAL:CNPJ" (e-CNPJ) ou "NOME:CPF" (e-CPF).
  const [, nome = cn, doc = ''] = cn.match(/^(.*):(\d{11}|\d{14})$/) ?? [];
  let documento = doc;
  if (!documento) {
    const san = cert.getExtension('subjectAltName') as { altNames?: unknown[] } | undefined;
    const bruto = JSON.stringify(san?.altNames ?? []);
    documento = bruto.includes(OID_CNPJ) ? (bruto.match(/\d{14}/)?.[0] ?? '') : '';
  }
  if (!/^\d{11}$|^\d{14}$/.test(documento)) {
    throw new ErroCertificado(
      'Não encontramos CNPJ ou CPF no certificado. Ele é ICP-Brasil tipo A1?',
    );
  }

  return {
    titular: nome.trim(),
    documento,
    tipo: documento.length === 14 ? 'e-CNPJ' : 'e-CPF',
    validoDe: cert.validity.notBefore,
    validoAte: cert.validity.notAfter,
  };
}
