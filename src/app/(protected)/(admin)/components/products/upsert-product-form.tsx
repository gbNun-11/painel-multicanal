"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { upsertProductAction } from "@/src/actions/products/upsert-product";
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
import upsertProductSchema, {
  type UpsertProductFormData,
} from "@/src/schemas/product/upsertProductSchema";

import type { ProductTableRow } from "./types";

interface UpsertProductFormProps {
  insurerId: string;

  insurerName: string;

  product?: ProductTableRow;

  onSuccess: () => void;
}

const getDefaultValues = (
  insurerId: string,
  product?: ProductTableRow,
): UpsertProductFormData => ({
  id: product?.id,

  insurerId,

  name: product?.name ?? "",
});

const UpsertProductForm = ({
  insurerId,
  insurerName,
  product,
  onSuccess,
}: UpsertProductFormProps) => {
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpsertProductFormData>({
    resolver: zodResolver(upsertProductSchema),

    defaultValues: getDefaultValues(insurerId, product),

    mode: "onBlur",
  });

  useEffect(() => {
    reset(getDefaultValues(insurerId, product));
  }, [insurerId, product, reset]);

  const { execute, isPending } = useAction(upsertProductAction, {
    onSuccess: () => {
      toast.add({
        type: "success",

        title: isEditing ? "Produto atualizado" : "Produto criado",

        description: isEditing
          ? "Produto atualizado com sucesso."
          : "Produto cadastrado com sucesso.",
      });

      reset(getDefaultValues(insurerId));

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",

        title: isEditing
          ? "Erro ao atualizar produto"
          : "Erro ao criar produto",

        description: error.serverError ?? "Não foi possível salvar o produto.",
      });
    },
  });

  const onSubmit = (data: UpsertProductFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar produto" : "Novo produto"}
        </DialogTitle>

        <DialogDescription>
          {isEditing
            ? "Atualize o produto lógico da seguradora."
            : "Cadastre um novo produto lógico para a seguradora."}
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Seguradora</p>

        <p className="font-medium">{insurerName}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("insurerId")} />

        {isEditing && <input type="hidden" {...register("id")} />}

        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="product-name">Produto lógico</Label>

            <Input
              id="product-name"
              type="text"
              placeholder="Ex.: Seguro Viagem"
              autoComplete="off"
              aria-invalid={!!errors.name}
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}

            {!errors.name && (
              <p className="text-xs text-muted-foreground">
                O produto lógico agrupa uma ou mais variações externas da
                seguradora.
              </p>
            )}
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
              "Cadastrar produto"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertProductForm;
