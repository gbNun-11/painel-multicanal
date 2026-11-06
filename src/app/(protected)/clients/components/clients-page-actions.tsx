"use client";

import { ListIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import SearchQueryInput from "@/src/components/ui/search-query-input";

import type { GoalfyImportOptions } from "@/src/data/clients/goalfy-import-types";

import ClientsSyncMenu from "./clients-sync-menu";

interface ClientsPageActionsProps {
  products: string[];
  companies: { id: string; name: string }[];
  syncLabel: string;
  goalfyOptions: GoalfyImportOptions;
}

const SALES_MODEL_OPTIONS = [
  {
    value: "LEAD",
    label: "Lead",
  },
  {
    value: "VINCULO",
    label: "Vínculo",
  },
  {
    value: "CONTINGENCIA",
    label: "Contingência",
  },
] as const;

const getSaoPauloDate = (offsetDays = 0) => {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const ClientsPageActions = ({
  products,
  companies,
  syncLabel,
  goalfyOptions,
}: ClientsPageActionsProps) => {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [productSearch, setProductSearch] = useState("");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [selectedEnterpriseIds, setSelectedEnterpriseIds] = useState<string[]>(
    [],
  );

  const [selectedSalesModels, setSelectedSalesModels] = useState<string[]>([]);

  const navigate = (params: URLSearchParams) => {
    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const activeFilterCount =
    Number(Boolean(searchParams.get("from") || searchParams.get("to"))) +
    Number(searchParams.getAll("product").length > 0) +
    Number(searchParams.getAll("salesModel").length > 0) +
    Number(searchParams.getAll("enterpriseId").length > 0);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase("pt-BR");

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      product.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [productSearch, products]);

  const handleFiltersOpenChange = (open: boolean) => {
    setFiltersOpen(open);

    if (!open) {
      return;
    }

    setDateFrom(searchParams.get("from") ?? "");

    setDateTo(searchParams.get("to") ?? "");

    setSelectedProducts(searchParams.getAll("product"));

    setSelectedEnterpriseIds(searchParams.getAll("enterpriseId"));

    setSelectedSalesModels(searchParams.getAll("salesModel"));

    setProductSearch("");
  };

  const toggleProduct = (product: string, checked: boolean) => {
    setSelectedProducts((current) => {
      if (checked) {
        return [...new Set([...current, product])];
      }

      return current.filter((value) => value !== product);
    });
  };

  const toggleEnterpriseId = (enterpriseId: string, checked: boolean) => {
    setSelectedEnterpriseIds((current) =>
      checked
        ? [...new Set([...current, enterpriseId])]
        : current.filter((value) => value !== enterpriseId),
    );
  };

  const toggleSalesModel = (salesModel: string, checked: boolean) => {
    setSelectedSalesModels((current) => {
      if (checked) {
        return [...new Set([...current, salesModel])];
      }

      return current.filter((value) => value !== salesModel);
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParamsString);

    params.delete("from");

    params.delete("to");

    params.delete("product");

    params.delete("salesModel");
    params.delete("enterpriseId");

    params.delete("page");

    if (dateFrom) {
      params.set("from", dateFrom);
    }

    if (dateTo) {
      params.set("to", dateTo);
    }

    for (const product of selectedProducts) {
      params.append("product", product);
    }

    for (const salesModel of selectedSalesModels) {
      params.append("salesModel", salesModel);
    }

    for (const enterpriseId of selectedEnterpriseIds) {
      params.append("enterpriseId", enterpriseId);
    }

    navigate(params);

    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParamsString);

    params.delete("from");

    params.delete("to");

    params.delete("product");

    params.delete("salesModel");
    params.delete("enterpriseId");

    params.delete("page");

    setDateFrom("");

    setDateTo("");

    setSelectedProducts([]);

    setSelectedEnterpriseIds([]);

    setSelectedSalesModels([]);

    navigate(params);

    setFiltersOpen(false);
  };

  const applyToday = () => {
    const today = getSaoPauloDate();

    setDateFrom(today);

    setDateTo(today);
  };

  const applyLastDays = (days: number) => {
    setDateFrom(getSaoPauloDate(-(days - 1)));

    setDateTo(getSaoPauloDate());
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchQueryInput placeholder="Pesquisar nome ou CPF/CNPJ..." />

      <Dialog open={filtersOpen} onOpenChange={handleFiltersOpenChange}>
        <DialogTrigger
          render={
            <Button variant="outline">
              <ListIcon />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          }
        />

        <DialogContent className="flex max-h-[88dvh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b pb-4">
            <DialogTitle>Filtros de clientes</DialogTitle>

            <DialogDescription>
              Combine os filtros para localizar os clientes desejados.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 py-5">
            <div className="space-y-3">
              <div>
                <DialogTitle>Data de chegada</DialogTitle>

                <DialogDescription>
                  Data original recebida da seguradora.
                </DialogDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyToday}
                >
                  Hoje
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyLastDays(7)}
                >
                  Últimos 7 dias
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyLastDays(30)}
                >
                  Últimos 30 dias
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="clients-date-from"
                    className="text-sm font-medium"
                  >
                    De
                  </label>

                  <Input
                    id="clients-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="clients-date-to"
                    className="text-sm font-medium"
                  >
                    Até
                  </label>

                  <Input
                    id="clients-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <DialogTitle>Produtos</DialogTitle>

                <DialogDescription>
                  Selecione um ou mais produtos.
                </DialogDescription>
              </div>

              {products.length > 6 ? (
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Pesquisar produto..."
                />
              ) : null}

              <div className="max-h-52 overflow-y-auto rounded-lg border bg-muted/10 p-1">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <label
                      key={product}
                      className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-3 py-2.5 transition-colors last:border-b-0 hover:rounded-md hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product)}
                        onCheckedChange={(checked) =>
                          toggleProduct(product, checked)
                        }
                      />
                      <span className="min-w-0 wrap-break-word text-sm font-medium">
                        {product}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Nenhum produto encontrado.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <DialogTitle>Empresa</DialogTitle>

                <DialogDescription>
                  Selecione uma ou mais empresas para mostrar somente suas
                  oportunidades.
                </DialogDescription>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-lg border bg-muted/10 p-1">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <label
                      key={company.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-3 py-2.5 transition-colors last:border-b-0 hover:rounded-md hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={selectedEnterpriseIds.includes(company.id)}
                        onCheckedChange={(checked) =>
                          toggleEnterpriseId(company.id, checked)
                        }
                      />
                      <span className="min-w-0 wrap-break-word text-sm font-medium">
                        {company.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma empresa com oportunidades disponíveis.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <DialogTitle>Modelo</DialogTitle>

                <DialogDescription>
                  Modelo comercial da oportunidade.
                </DialogDescription>
              </div>

              <div className="overflow-hidden rounded-lg border bg-muted/10 p-1">
                {SALES_MODEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-3 py-2.5 transition-colors last:border-b-0 hover:rounded-md hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={selectedSalesModels.includes(option.value)}
                      onCheckedChange={(checked) =>
                        toggleSalesModel(option.value, checked)
                      }
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-1 pt-4">
            <Button type="button" variant="ghost" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleApplyFilters}>
              Aplicar filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientsSyncMenu syncLabel={syncLabel} goalfyOptions={goalfyOptions} />
    </div>
  );
};

export default ClientsPageActions;
