"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getProductsAction } from "@/src/actions/products/get-products";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Dialog } from "@/src/components/ui/dialog";
import {
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { toast } from "@/src/components/ui/toast";
import { statusLabels } from "@/src/constants/enums";

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
      setProducts([]);

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

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-muted/60 dark:bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Produto</TableHead>

                    <TableHead className="font-semibold">
                      Variações ativas
                    </TableHead>

                    <TableHead className="font-semibold">Status</TableHead>

                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2Icon className="size-4 animate-spin" />
                          Carregando produtos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum produto cadastrado para esta seguradora.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => {
                      const activeCodesCount = product.codes.filter(
                        (code) => code.status === "ativo",
                      ).length;

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>

                          <TableCell>{activeCodesCount}</TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                product.status === "ativo"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {statusLabels[product.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <ProductActions
                              product={product}
                              insurerName={selectedInsurer.name}
                              onSuccess={loadProducts}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
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
