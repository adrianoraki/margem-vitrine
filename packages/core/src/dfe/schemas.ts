import { z } from 'zod';
import { cnpjSchema } from '../cnpj';

// Validação do que o importador extrai de cada NF-e (RF-21) antes de gravar em
// compras.notas / compras.itens_compra. O leitor de XML (./xml.ts) cumpre este contrato.

const eanSchema = z
  .string()
  .trim()
  .transform((v) => (v === 'SEM GTIN' || v === '' ? null : v))
  .pipe(
    z
      .string()
      .regex(/^\d{8}$|^\d{12,14}$/)
      .nullable(),
  );

/** Item de NF-e extraído (produto, EAN, NCM, quantidade, unidade, valor). "SEM GTIN" vira EAN nulo. */
export const itemNotaSchema = z.object({
  numeroItem: z.number().int().positive(),
  descricao: z.string().trim().min(1),
  ean: eanSchema.nullable(),
  ncm: z
    .string()
    .regex(/^\d{8}$/)
    .nullable(),
  cfop: z
    .string()
    .regex(/^\d{4}$/)
    .nullable(),
  quantidade: z.number().positive(),
  unidade: z.string().trim().min(1).max(6),
  valorUnitario: z.number().nonnegative(),
  valorTotal: z.number().nonnegative(),
});
export type ItemNota = z.infer<typeof itemNotaSchema>;

/** NF-e extraída: chave de 44 dígitos, emitente (CNPJ validado ou CPF), total e ao menos um item. */
export const notaSchema = z.object({
  chave: z.string().regex(/^\d{44}$/, 'chave de acesso deve ter 44 dígitos'),
  numero: z.string().min(1),
  serie: z.string().min(1),
  emitidaEm: z.iso.datetime({ offset: true }),
  emitente: z.object({
    documento: z.union([cnpjSchema, z.string().regex(/^\d{11}$/)]),
    nome: z.string().trim().min(1),
    uf: z.string().length(2).nullable(),
  }),
  /** Quem comprou. Serve para conferir que a nota é da empresa; o e-mail nunca é extraído. */
  destinatario: z
    .object({
      documento: z
        .string()
        .regex(/^\d{11}$|^\d{14}$/)
        .nullable(),
      nome: z.string().trim().nullable(),
    })
    .nullable()
    .optional(),
  valorTotal: z.number().nonnegative(),
  itens: z.array(itemNotaSchema).min(1),
});
export type Nota = z.infer<typeof notaSchema>;
