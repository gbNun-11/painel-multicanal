"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getProductsAction } from "@/src/actions/products/get-products";
import { Button } from "@/src/components/ui/button";
import { DataTable } from "@/src/components/ui/data-table";
import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { toast } from "@/src/components/ui/toast";

import ProductActions from "./product-actions";
import type { ProductInsurerOption, ProductTableRow } from "./types";
import UpsertProductForm from "./upsert-product-form";

interface ManageProductsDialogProps {
  open: boolean;
  insurers: ProductInsurerOption[];
}

const ManageProductsDialog = ({
  open,
  insurers,
}: ManageProductsDialogProps) => {
  const [selectedInsurerId, setSelectedInsurerId] = useState<string | null>(
    null,
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [products, setProducts] = useState<ProductTableRow[]>([]);

  const insurerItems = useMemo(
    () =>
      insurers.map((insurer) => ({
        value: insurer.id,
        label: insurer.name,
      })),
    [insurers],
  );

  const selectedInsurer =
    insurers.find((insurer) => insurer.id === selectedInsurerId) ?? null;

  const insurerName = selectedInsurer?.name ?? "";

  const { execute, isPending } = useAction(getProductsAction, {
    onSuccess: ({ data }) => {
      setProducts(data?.products ?? []);
    },

    onError: ({ error }) => {
      setProducts([]);

      toast.add({
        type: "error",
        title: "Erro ao carregar produtos",
        description:
          error.serverError ??
          "Não foi possível carregar os produtos da seguradora.",
      });
    },
  });

  const loadProducts = useCallback(() => {
    if (!selectedInsurerId) {
      return;
    }

    execute({
      insurerId: selectedInsurerId,
    });
  }, [execute, selectedInsurerId]);

  useEffect(() => {
    if (!open || !selectedInsurerId) {
      return;
    }

    loadProducts();
  }, [open, selectedInsurerId, loadProducts]);

  const columns = useMemo<ColumnDef<DataTableFeatures, ProductTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Produto",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "activeCodesCount",
        header: "Variações ativas",
        cell: ({ row }) =>
          row.original.codes.filter((code) => code.status === "ativo").length,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ProductActions
              product={row.original}
              insurerName={insurerName}
              onSuccess={loadProducts}
            />
          </div>
        ),
      },
    ],
    [insurerName, loadProducts],
  );

  return (
    <>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerenciar produtos</DialogTitle>

          <DialogDescription>
            Gerencie os produtos lógicos cadastrados por seguradora.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="products-insurer">Seguradora</Label>

          <Select
            items={insurerItems}
            value={selectedInsurerId}
            onValueChange={(value) => {
              setSelectedInsurerId(value);
              setProducts([]);
            }}
          >
            <SelectTrigger id="products-insurer" className="w-full">
              <SelectValue placeholder="Selecione uma seguradora" />
            </SelectTrigger>

            <SelectContent>
              {insurerItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedInsurer ? (
          <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Selecione uma seguradora para consultar e gerenciar seu catálogo de
            produtos.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{selectedInsurer.name}</p>

                <p className="text-sm text-muted-foreground">
                  Produtos lógicos da seguradora selecionada.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setCreateDialogOpen(true);
                }}
              >
                <PlusIcon className="size-4" />
                Novo produto
              </Button>
            </div>

            <DataTable
              columns={columns}
              data={products}
              getRowId={(product) => product.id}
              isLoading={isPending}
              loadingMessage="Carregando produtos..."
              emptyMessage="Nenhum produto cadastrado para esta seguradora."
            />
          </>
        )}
      </DialogContent>

      {selectedInsurer && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <UpsertProductForm
            insurerId={selectedInsurer.id}
            insurerName={selectedInsurer.name}
            onSuccess={() => {
              setCreateDialogOpen(false);
              loadProducts();
            }}
          />
        </Dialog>
      )}
    </>
  );
};

export default ManageProductsDialog;
