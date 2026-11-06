"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { upsertProductCodeAction } from "@/src/actions/products/upsert-product-code";
import { Button } from "@/src/components/ui/button";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/toast";
import upsertProductCodeSchema, {
  type UpsertProductCodeFormData,
} from "@/src/schemas/product/upsertProductCodeSchema";

import type { ProductCodeTableRow, ProductTableRow } from "./types";

interface UpsertProductCodeFormProps {
  insurerName: string;

  product: ProductTableRow;

  productCode?: ProductCodeTableRow;

  onSuccess: () => void;
}

const getDefaultValues = (
  productId: string,
  productCode?: ProductCodeTableRow,
): UpsertProductCodeFormData => ({
  id: productCode?.id,

  productId,

  code: productCode?.code ?? "",

  name: productCode?.name ?? "",
});

const UpsertProductCodeForm = ({
  insurerName,
  product,
  productCode,
  onSuccess,
}: UpsertProductCodeFormProps) => {
  const isEditing = Boolean(productCode);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpsertProductCodeFormData>({
    resolver: zodResolver(upsertProductCodeSchema),

    defaultValues: getDefaultValues(product.id, productCode),

    mode: "onBlur",
  });

  useEffect(() => {
    reset(getDefaultValues(product.id, productCode));
  }, [product.id, productCode, reset]);

  const { execute, isPending } = useAction(upsertProductCodeAction, {
    onSuccess: () => {
      toast.add({
        type: "success",

        title: isEditing ? "Código atualizado" : "Código cadastrado",

        description: isEditing
          ? "A variação do produto foi atualizada com sucesso."
          : "A variação do produto foi cadastrada com sucesso.",
      });

      reset(getDefaultValues(product.id));

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",

        title: isEditing
          ? "Erro ao atualizar código"
          : "Erro ao cadastrar código",

        description:
          error.serverError ?? "Não foi possível salvar a variação do produto.",
      });
    },
  });

  const onSubmit = (data: UpsertProductCodeFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar código" : "Novo código"}</DialogTitle>

        <DialogDescription>
          {isEditing
            ? "Atualize a variação externa vinculada ao produto lógico."
            : "Cadastre uma variação externa da seguradora para o produto lógico."}
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="grid gap-3 rounded-md border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Seguradora</p>

          <p className="font-medium">{insurerName}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Produto lógico</p>

          <p className="font-medium">{product.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("productId")} />

        {isEditing && <input type="hidden" {...register("id")} />}

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="product-code">Código</Label>

              <Input
                id="product-code"
                type="text"
                placeholder="Ex.: 610"
                autoComplete="off"
                aria-invalid={!!errors.code}
                {...register("code")}
              />

              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-code-name">Nome da variação</Label>

              <Input
                id="product-code-name"
                type="text"
                placeholder="Ex.: Seguro Viagem Internacional"
                autoComplete="off"
                aria-invalid={!!errors.name}
                {...register("name")}
              />

              {errors.name ? (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Use o nome informado pela seguradora para esta variação.
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />

                {isEditing ? "Salvando..." : "Cadastrando..."}
              </>
            ) : isEditing ? (
              "Salvar alterações"
            ) : (
              "Cadastrar código"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertProductCodeForm;
