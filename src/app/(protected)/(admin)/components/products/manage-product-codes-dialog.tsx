"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

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
import { Separator } from "@/src/components/ui/separator";
import { StatusBadge } from "@/src/components/ui/status-badge";

import ProductCodeActions from "./product-code-actions";
import type { ProductCodeTableRow, ProductTableRow } from "./types";
import UpsertProductCodeForm from "./upsert-product-code-form";

interface ManageProductCodesDialogProps {
  insurerName: string;
  product: ProductTableRow;
  onSuccess: () => void;
}

const ManageProductCodesDialog = ({
  insurerName,
  product,
  onSuccess,
}: ManageProductCodesDialogProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const productIsActive = product.status === "ativo";

  const columns = useMemo<ColumnDef<DataTableFeatures, ProductCodeTableRow>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Código",
        cell: ({ row }) => (
          <span className="font-mono font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Variação",
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
            <ProductCodeActions
              insurerName={insurerName}
              product={product}
              productCode={row.original}
              onSuccess={onSuccess}
            />
          </div>
        ),
      },
    ],
    [insurerName, onSuccess, product],
  );

  return (
    <>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerenciar códigos</DialogTitle>

          <DialogDescription>
            Gerencie as variações externas vinculadas ao produto lógico.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Seguradora</p>

            <p className="font-medium">{insurerName}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Produto lógico</p>

            <p className="font-medium">{product.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Variações</p>

            <p className="text-sm text-muted-foreground">
              Códigos recebidos da seguradora que pertencem a este produto.
            </p>
          </div>

          <Button
            type="button"
            disabled={!productIsActive}
            onClick={() => {
              setCreateDialogOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            Novo código
          </Button>
        </div>

        {!productIsActive && (
          <p className="text-sm text-muted-foreground">
            O produto está inativo. Ative-o para cadastrar ou editar variações.
          </p>
        )}

        <DataTable
          columns={columns}
          data={product.codes}
          getRowId={(productCode) => productCode.id}
          emptyMessage="Nenhuma variação cadastrada para este produto."
        />
      </DialogContent>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <UpsertProductCodeForm
          insurerName={insurerName}
          product={product}
          onSuccess={() => {
            setCreateDialogOpen(false);
            onSuccess();
          }}
        />
      </Dialog>
    </>
  );
};

export default ManageProductCodesDialog;
