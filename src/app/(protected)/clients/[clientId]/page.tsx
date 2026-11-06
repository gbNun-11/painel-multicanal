import {
  BriefcaseBusinessIcon,
  ContactRoundIcon,
  HistoryIcon,
  LayersIcon,
  MapPinIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/src/components/ui/badge";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";
import { getClient360 } from "@/src/data/clients/get-client-360";
import { formatDocument, formatPhone } from "@/src/utils/formatters";

import BackToOrigin from "./back-to-origin";

interface Client360PageProps {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

const formatDateTime = (date: Date | null): string =>
  date
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date)
    : "Não informado";

const formatDateOnly = (date: string | null): string =>
  date ? date.split("-").reverse().join("/") : "Não informado";

const formatMoney = (value: string | null): string =>
  value === null
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(value));

const present = (value: string | null | undefined): string =>
  value?.trim() || "Não informado";

const formatStatus = (value: string): string =>
  value.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>

      <dd className="wrap-break-word text-sm font-medium">{value}</dd>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ContactRoundIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h2>

      {children}
    </section>
  );
}

export default async function Client360Page({
  params,
  searchParams,
}: Client360PageProps) {
  const { clientId } = await params;
  const query = await searchParams;

  const pageParam = Array.isArray(query.page) ? query.page[0] : query.page;

  const requestedPage = Number(pageParam);

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const { client, opportunities, pagination } = await getClient360({
    clientId,
    page,
  });

  if (page !== pagination.page) {
    redirect(`/clients/${client.id}?page=${pagination.page}`);
  }

  const fullAddress = [
    client.address,
    client.addressNumber,
    client.addressComplement,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <div className="mb-3">
            <BackToOrigin />
          </div>

          <PageTitle>{client.name}</PageTitle>

          <PageDescription>
            Cliente 360 · {formatDocument(client.document)} · {pagination.total}{" "}
            {pagination.total === 1 ? "oportunidade" : "oportunidades"}
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>

      <PageContent>
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Dados cadastrais" icon={ContactRoundIcon}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Nome" value={client.name} />

              <Detail
                label="CPF/CNPJ"
                value={formatDocument(client.document)}
              />

              <Detail label="Tipo de pessoa" value={client.personType} />

              <Detail
                label="Nascimento"
                value={formatDateOnly(client.birthDate)}
              />

              <Detail label="Sexo" value={present(client.sex)} />

              <Detail label="Profissão" value={present(client.profession)} />

              <Detail
                label="Telefone"
                value={
                  client.phone ? formatPhone(client.phone) : "Não informado"
                }
              />

              <Detail label="E-mail" value={present(client.email)} />
            </dl>
          </Section>

          <Section title="Endereço" icon={MapPinIcon}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Logradouro"
                value={fullAddress || "Não informado"}
              />

              <Detail label="Bairro" value={present(client.neighborhood)} />

              <Detail label="Cidade" value={present(client.city)} />

              <Detail label="UF" value={present(client.state)} />

              <Detail label="CEP" value={present(client.zipCode)} />
            </dl>
          </Section>

          <Section title="Dados complementares" icon={BriefcaseBusinessIcon}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Faixa de renda mensal"
                value={present(client.monthlyIncomeRange)}
              />

              <Detail
                label="Atividade econômica"
                value={present(client.economicActivity)}
              />

              <Detail
                label="Tipo de empresa"
                value={present(client.companyType)}
              />

              <Detail
                label="Patrimônio líquido"
                value={formatMoney(client.netWorth)}
              />

              <Detail
                label="Receita operacional bruta anual"
                value={formatMoney(client.annualGrossOperatingRevenue)}
              />
            </dl>
          </Section>

          <Section title="Datas do cadastro" icon={HistoryIcon}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Criado no V2"
                value={formatDateTime(client.createdAt)}
              />

              <Detail
                label="Atualizado no V2"
                value={formatDateTime(client.updatedAt)}
              />
            </dl>

            <p className="mt-5 text-xs text-muted-foreground">
              Estas datas se referem ao cadastro do V2 e não constituem um
              histórico de auditoria de alterações.
            </p>
          </Section>
        </div>

        <section className="mt-4 rounded-lg border bg-card p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <LayersIcon className="size-4 text-muted-foreground" />
              Oportunidades
            </h2>

            <span className="text-sm text-muted-foreground">
              {pagination.total}{" "}
              {pagination.total === 1 ? "registro" : "registros"}
            </span>
          </div>

          {opportunities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma oportunidade vinculada a este cliente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-235 text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">Seguradora / Empresa</th>

                    <th className="p-3 font-medium">Produto / Origem</th>

                    <th className="p-3 font-medium">Propensão</th>

                    <th className="p-3 font-medium">Distribuição</th>

                    <th className="p-3 font-medium">Comercial</th>

                    <th className="p-3 font-medium">Responsável</th>

                    <th className="p-3 font-medium">Chegada</th>
                  </tr>
                </thead>

                <tbody>
                  {opportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="border-b last:border-0">
                      <td className="p-3 align-top">
                        <div className="font-medium">
                          {opportunity.insurerName}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {opportunity.enterpriseName}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          SUSEP: {opportunity.susepCode}
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-medium">{opportunity.product}</div>

                        <div className="text-xs text-muted-foreground">
                          {opportunity.externalSource}
                          {" · "}
                          {opportunity.productCode}
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        {present(opportunity.propensity)}
                      </td>

                      <td className="p-3 align-top">
                        <Badge variant="secondary">
                          {formatStatus(opportunity.distributionStatus)}
                        </Badge>
                      </td>

                      <td className="p-3 align-top">
                        <Badge variant="outline">
                          {formatStatus(opportunity.salesStatus)}
                        </Badge>
                      </td>

                      <td className="p-3 align-top">
                        <div>{present(opportunity.salespersonName)}</div>

                        <div className="text-xs text-muted-foreground">
                          {opportunity.assignedAt
                            ? `Atribuído: ${formatDateTime(
                                opportunity.assignedAt,
                              )}`
                            : "Não atribuído"}
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        {formatDateTime(
                          opportunity.sourceCreatedAt ?? opportunity.createdAt,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav
              aria-label="Paginação de oportunidades"
              className="mt-5 flex items-center justify-end gap-3 border-t pt-4 text-sm"
            >
              {pagination.page > 1 ? (
                <Link
                  href={`/clients/${client.id}?page=${pagination.page - 1}`}
                  className="rounded-md border px-3 py-2 hover:bg-accent"
                >
                  Anterior
                </Link>
              ) : (
                <span className="rounded-md border px-3 py-2 text-muted-foreground opacity-50">
                  Anterior
                </span>
              )}

              <span className="text-muted-foreground">
                {pagination.page} de {pagination.totalPages}
              </span>

              {pagination.page < pagination.totalPages ? (
                <Link
                  href={`/clients/${client.id}?page=${pagination.page + 1}`}
                  className="rounded-md border px-3 py-2 hover:bg-accent"
                >
                  Próxima
                </Link>
              ) : (
                <span className="rounded-md border px-3 py-2 text-muted-foreground opacity-50">
                  Próxima
                </span>
              )}
            </nav>
          )}
        </section>
      </PageContent>
    </PageContainer>
  );
}
