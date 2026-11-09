"use client";

import { CircleCheckIcon, CircleXIcon, PencilIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeProductCodeStatusAction } from "@/src/actions/products/change-product-code-status";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { TableRowActions } from "@/src/components/ui/table-row-actions";
import { toast } from "@/src/components/ui/toast";

import type { ProductCodeTableRow, ProductTableRow } from "./types";
import UpsertProductCodeForm from "./upsert-product-code-form";

interface ProductCodeActionsProps {
  insurerName: string;
  product: ProductTableRow;
  productCode: ProductCodeTableRow;
  onSuccess: () => void;
}

const ProductCodeActions = ({
  insurerName,
  product,
  productCode,
  onSuccess,
}: ProductCodeActionsProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const productIsActive = product.status === "ativo";

  const canActivate = productCode.status === "inativo" && productIsActive;

  const { execute, isPending } = useAction(changeProductCodeStatusAction, {
    onSuccess: () => {
      const isActive = productCode.status === "ativo";

      toast.add({
        type: "success",
        title: isActive ? "Código inativado" : "Código ativado",
        description: isActive
          ? "A variação foi inativada com sucesso."
          : "A variação foi ativada com sucesso.",
      });

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao alterar código",
        description:
          error.serverError ?? "Não foi possível alterar o status da variação.",
      });
    },
  });

  const handleChangeStatus = () => {
    execute({
      id: productCode.id,
      status: productCode.status === "ativo" ? "inativo" : "ativo",
    });
  };

  return (
    <>
      <TableRowActions
        label={`Abrir ações do código ${productCode.code}`}
        disabled={isPending}
      >
        <DropdownMenuItem
          disabled={!productIsActive}
          onClick={() => {
            setEditDialogOpen(true);
          }}
        >
          <PencilIcon className="size-4" />
          Editar
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleChangeStatus}
          disabled={
            isPending || (productCode.status === "inativo" && !canActivate)
          }
        >
          {productCode.status === "ativo" ? (
            <>
              <CircleXIcon className="size-4" />
              Inativar
            </>
          ) : (
            <>
              <CircleCheckIcon className="size-4" />
              Ativar
            </>
          )}
        </DropdownMenuItem>
      </TableRowActions>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <UpsertProductCodeForm
          insurerName={insurerName}
          product={product}
          productCode={productCode}
          onSuccess={() => {
            setEditDialogOpen(false);
            onSuccess();
          }}
        />
      </Dialog>
    </>
  );
};

export default ProductCodeActions;
