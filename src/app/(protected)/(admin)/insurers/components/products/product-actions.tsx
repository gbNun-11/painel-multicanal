"use client";

import {
  CircleCheckIcon,
  CircleXIcon,
  EllipsisIcon,
  ListTreeIcon,
  PencilIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeProductStatusAction } from "@/src/actions/products/change-product-status";
import { Button } from "@/src/components/ui/button";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/toast";

import ManageProductCodesDialog from "./manage-product-codes-dialog";
import type { ProductTableRow } from "./types";
import UpsertProductForm from "./upsert-product-form";

interface ProductActionsProps {
  product: ProductTableRow;

  insurerName: string;

  onSuccess: () => void;
}

const ProductActions = ({
  product,
  insurerName,
  onSuccess,
}: ProductActionsProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [codesDialogOpen, setCodesDialogOpen] = useState(false);

  const { execute, isPending } = useAction(changeProductStatusAction, {
    onSuccess: () => {
      const isActive = product.status === "ativo";

      toast.add({
        type: "success",

        title: isActive ? "Produto inativado" : "Produto ativado",

        description: isActive
          ? "O produto foi inativado com sucesso."
          : "O produto foi ativado com sucesso.",
      });

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",

        title: "Erro ao alterar produto",

        description:
          error.serverError ?? "Não foi possível alterar o status do produto.",
      });
    },
  });

  const handleChangeStatus = () => {
    execute({
      id: product.id,

      status: product.status === "ativo" ? "inativo" : "ativo",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
            >
              <EllipsisIcon className="size-4" />

              <span className="sr-only">Abrir ações</span>
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditDialogOpen(true);
            }}
          >
            <PencilIcon className="size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setCodesDialogOpen(true);
            }}
          >
            <ListTreeIcon className="size-4" />
            Gerenciar códigos
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleChangeStatus} disabled={isPending}>
            {product.status === "ativo" ? (
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
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <UpsertProductForm
          insurerId={product.insurerId}
          insurerName={insurerName}
          product={product}
          onSuccess={() => {
            setEditDialogOpen(false);

            onSuccess();
          }}
        />
      </Dialog>

      <Dialog open={codesDialogOpen} onOpenChange={setCodesDialogOpen}>
        <ManageProductCodesDialog
          insurerName={insurerName}
          product={product}
          onSuccess={onSuccess}
        />
      </Dialog>
    </>
  );
};

export default ProductActions;
