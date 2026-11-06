"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { statusLabels } from "@/src/constants/enums";

import ProductCodeActions from "./product-code-actions";
import type { ProductTableRow } from "./types";
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

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted/60 dark:bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold">Código</TableHead>

                <TableHead className="font-semibold">Variação</TableHead>

                <TableHead className="font-semibold">Status</TableHead>

                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {product.codes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma variação cadastrada para este produto.
                  </TableCell>
                </TableRow>
              ) : (
                product.codes.map((productCode) => (
                  <TableRow key={productCode.id}>
                    <TableCell className="font-mono font-medium">
                      {productCode.code}
                    </TableCell>

                    <TableCell>{productCode.name}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          productCode.status === "ativo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {statusLabels[productCode.status]}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <ProductCodeActions
                        insurerName={insurerName}
                        product={product}
                        productCode={productCode}
                        onSuccess={onSuccess}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
