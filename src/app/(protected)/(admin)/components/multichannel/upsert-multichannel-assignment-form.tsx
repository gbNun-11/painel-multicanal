"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { upsertMultichannelAssignmentAction } from "@/src/actions/multichannel/upsert-multichannel-assignment";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { FormSubmitButton } from "@/src/components/ui/form-submit-button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/toast";
import upsertMultichannelAssignmentSchema, {
  type UpsertMultichannelAssignmentFormData,
} from "@/src/schemas/multichannel/upsertMultichannelAssignmentSchema";

import type {
  MultichannelAssignmentTableRow,
  MultichannelProductOption,
  MultichannelUserOption,
} from "./types";

interface UpsertMultichannelAssignmentFormProps {
  susepId: string;

  susepCode: string;

  assignment?: MultichannelAssignmentTableRow;

  products: MultichannelProductOption[];

  users: MultichannelUserOption[];

  onSuccess: () => void;
}

const getDefaultValues = (
  susepId: string,
  assignment?: MultichannelAssignmentTableRow,
): UpsertMultichannelAssignmentFormData => ({
  id: assignment?.id,

  susepId,

  productId: assignment?.productId ?? "",

  userId: assignment?.userId ?? "",

  leadCapacity: assignment?.leadCapacity ?? null,
});

const UpsertMultichannelAssignmentForm = ({
  susepId,
  susepCode,
  assignment,
  products,
  users,
  onSuccess,
}: UpsertMultichannelAssignmentFormProps) => {
  const isEditing = Boolean(assignment);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpsertMultichannelAssignmentFormData>({
    resolver: zodResolver(upsertMultichannelAssignmentSchema),

    defaultValues: getDefaultValues(susepId, assignment),

    mode: "onBlur",
  });

  useEffect(() => {
    reset(getDefaultValues(susepId, assignment));
  }, [susepId, assignment, reset]);

  const productItems = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
      })),
    [products],
  );

  const userItems = useMemo(() => {
    const items = users.map((user) => ({
      value: user.id,
      label: user.name,
      disabled: false,
    }));

    if (assignment && !users.some((user) => user.id === assignment.userId)) {
      items.push({
        value: assignment.userId,

        label: `${assignment.userName} (Inativo)`,

        disabled: true,
      });
    }

    return items;
  }, [users, assignment]);

  const { execute, isPending } = useAction(upsertMultichannelAssignmentAction, {
    onSuccess: () => {
      toast.add({
        type: "success",

        title: isEditing ? "Configuração atualizada" : "Configuração criada",

        description: isEditing
          ? "O usuário multicanal foi atualizado com sucesso."
          : "A configuração multicanal foi criada com sucesso.",
      });

      reset(getDefaultValues(susepId, assignment));
      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",

        title: isEditing
          ? "Erro ao atualizar configuração"
          : "Erro ao criar configuração",

        description:
          error.serverError ??
          "Não foi possível salvar a configuração multicanal.",
      });
    },
  });

  const onSubmit = (data: UpsertMultichannelAssignmentFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEditing
            ? "Editar configuração multicanal"
            : "Nova configuração multicanal"}
        </DialogTitle>

        <DialogDescription>
          Defina o usuário responsável pela entrada multicanal de um produto
          lógico.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">SUSEP multicanal</p>

        <p className="font-medium">{susepCode}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("susepId")} />

        {isEditing && <input type="hidden" {...register("id")} />}

        <CardContent>
          <div className="flex flex-col gap-6">
            {isEditing && assignment ? (
              <div className="grid gap-2">
                <Label>Produto lógico</Label>

                <div className="rounded-md border px-3 py-2 text-sm">
                  {assignment.productName}
                </div>

                <input type="hidden" {...register("productId")} />

                <p className="text-xs text-muted-foreground">
                  O produto não pode ser alterado em uma configuração existente.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="multichannel-product">Produto lógico</Label>

                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={productItems}
                      value={field.value || null}
                      onValueChange={(value) => {
                        if (value !== null) {
                          field.onChange(value);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="multichannel-product"
                        className="w-full"
                        aria-invalid={!!errors.productId}
                      >
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>

                      <SelectContent>
                        {productItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.productId && (
                  <p className="text-xs text-destructive">
                    {errors.productId.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="multichannel-user">Usuário multicanal</Label>

              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={userItems}
                    value={field.value || null}
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.onChange(value);

                        // A capacidade pertence ao CPF configurado.
                        // Ao trocar o usuário, solicitar o novo limite.
                        if (assignment && value !== assignment.userId) {
                          setValue("leadCapacity", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger
                      id="multichannel-user"
                      className="w-full"
                      aria-invalid={!!errors.userId}
                    >
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>

                    <SelectContent>
                      {userItems.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          disabled={item.disabled}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.userId ? (
                <p className="text-xs text-destructive">
                  {errors.userId.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Este usuário é a configuração multicanal. Ele não será
                  definido como vendedor da oportunidade.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="multichannel-lead-capacity">
                Capacity de LEAD
              </Label>

              <Input
                id="multichannel-lead-capacity"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                inputMode="numeric"
                placeholder="Informe o limite de LEAD"
                aria-invalid={!!errors.leadCapacity}
                {...register("leadCapacity", {
                  setValueAs: (value: string | number | null) =>
                    value === "" || value === null ? null : Number(value),
                })}
              />

              {errors.leadCapacity ? (
                <p className="text-xs text-destructive">
                  {errors.leadCapacity.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Limite informado pela Porto para o CPF e produto lógico
                  deste vínculo. Configurações antigas permanecem sem limite
                  até serem preenchidas.
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <FormSubmitButton
            isPending={isPending}
            idleLabel={
              isEditing ? "Salvar alterações" : "Criar configuração"
            }
            pendingLabel="Salvando..."
          />
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertMultichannelAssignmentForm;
