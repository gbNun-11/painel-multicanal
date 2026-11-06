import { z } from "zod";

const nullableTextSchema = z.string().nullish();

const nullableNumberLikeSchema = z.union([z.string(), z.number()]).nullish();

export const portoPhoneSchema = z
  .object({
    telefoneResidencial: nullableTextSchema,
    telefoneCelular: nullableTextSchema,
    telefoneComercial: nullableTextSchema,
  })
  .passthrough();

export const portoOpportunitySchema = z
  .object({
    idOportunidadeSql: nullableTextSchema,
    idOportunidadeDynamics: nullableTextSchema,

    idContatosTrabalhados: nullableTextSchema,
    susepTA: nullableTextSchema,
    susep: nullableTextSchema,
    idSiebel: nullableTextSchema,

    nomeCliente: z.string(),
    cpfCnpjCliente: z.string(),

    emailCliente: nullableTextSchema,
    nomeSocial: nullableTextSchema,
    tipoPessoa: nullableTextSchema,
    telefoneContato: portoPhoneSchema.nullish(),

    propensao: nullableTextSchema,
    codigoPropensao: nullableTextSchema,
    codigoProduto: nullableTextSchema,
    nomeProduto: nullableTextSchema,

    valorBem: nullableNumberLikeSchema,
    modelo: nullableTextSchema,
    modeloAno: nullableNumberLikeSchema,
    placa: nullableTextSchema,

    codigoOrigem: nullableTextSchema,
    nomeOrigem: nullableTextSchema,
    dataCriacao: nullableTextSchema,
    dataExpiracao: nullableTextSchema,
    observacoes: nullableTextSchema,
    dataNascimento: nullableTextSchema,
    razaoStatus: nullableTextSchema,

    contatoCidade: nullableTextSchema,
    contatoComplemento: nullableTextSchema,
    contatoBairro: nullableTextSchema,
    contatoNumero: nullableTextSchema,
    contatoEstado: nullableTextSchema,
    contatoCep: nullableTextSchema,
    contatoEndereco: nullableTextSchema,

    argumentacao: nullableTextSchema,
    programa: nullableTextSchema,
    codigoProdutoBCP: nullableTextSchema,
    codigoProdutoPai: nullableTextSchema,
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .passthrough();

export const portoOpportunitiesResponseSchema = z
  .object({
    itens: z.array(z.unknown()),
    totalPaginacao: z.number(),
  })
  .passthrough();

export type PortoOpportunity = z.infer<typeof portoOpportunitySchema>;

export type PortoOpportunitiesResponse = z.infer<
  typeof portoOpportunitiesResponseSchema
>;
