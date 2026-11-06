"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { getSusepsAction } from "@/src/actions/suseps/get-suseps";
import { upsertSusepAction } from "@/src/actions/suseps/upsert-susep";
import { Button } from "@/src/components/ui/button";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import upsertSusepSchema, {
  type UpsertSusepFormData,
} from "@/src/schemas/susep/upsertSusepSchema";

import type { SusepContext, SusepTableRow } from "./types";

interface UpsertSusepFormProps {
  context: SusepContext;
  susep?: SusepTableRow;
  onSuccess: () => void;
}

const UpsertSusepForm = ({
  context,
  susep,
  onSuccess,
}: UpsertSusepFormProps) => {
  const router = useRouter();

  const isEditing = Boolean(susep);

  const [suseps, setSuseps] = useState<SusepTableRow[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpsertSusepFormData>({
    resolver: zodResolver(upsertSusepSchema),

    defaultValues: {
      id: susep?.id,

      enterpriseInsurerId: context.enterpriseInsurerId,

      masterSusepId: susep?.masterSusepId ?? null,

      code: susep?.code ?? "",

      multichannel: susep?.multichannel ?? false,
    },

    mode: "onBlur",
  });

  const { execute: loadSuseps, isPending: isLoadingSuseps } = useAction(
    getSusepsAction,
    {
      onSuccess: ({ data }) => {
        setSuseps(data?.suseps ?? []);
      },

      onError: ({ error }) => {
        toast.add({
          type: "error",
          title: "Erro ao carregar SUSEPs",
          description:
            error.serverError ??
            "Não foi possível carregar as SUSEPs disponíveis.",
        });
      },
    },
  );

  const { execute, isPending } = useAction(upsertSusepAction, {
    onSuccess: ({ data }) => {
      const wasUpdated = data?.mode === "updated";

      toast.add({
        type: "success",
        title: wasUpdated ? "SUSEP atualizada" : "SUSEP vinculada",
        description: wasUpdated
          ? "A SUSEP foi atualizada com sucesso."
          : "A SUSEP foi vinculada com sucesso.",
      });

      router.refresh();

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: isEditing ? "Erro ao atualizar SUSEP" : "Erro ao vincular SUSEP",
        description: error.serverError ?? "Não foi possível salvar a SUSEP.",
      });
    },
  });

  useEffect(() => {
    loadSuseps({
      enterpriseInsurerId: context.enterpriseInsurerId,
    });
  }, [context.enterpriseInsurerId, loadSuseps]);

  const masterOptions = suseps
    .filter((candidate) => {
      if (candidate.id === susep?.id) {
        return false;
      }

      if (candidate.masterSusepId !== null) {
        return false;
      }

      if (candidate.status === "ativo") {
        return true;
      }

      return candidate.id === susep?.masterSusepId;
    })
    .map((candidate) => ({
      value: candidate.id,
      label: candidate.code,
    }));

  const selectItems = [
    {
      value: "none",
      label: "Nenhuma — SUSEP principal",
    },

    ...masterOptions,
  ];

  const onSubmit = (data: UpsertSusepFormData) => {
    execute(data);
  };

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar SUSEP" : "Vincular SUSEP"}
        </DialogTitle>

        <DialogDescription>
          {isEditing
            ? "Atualize os dados da SUSEP selecionada."
            : "Cadastre a SUSEP e defina sua estrutura dentro do vínculo."}
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Seguradora</p>

          <p className="font-medium">{context.insurerName}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Empresa</p>

          <p className="font-medium">{context.enterpriseName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isEditing && <input type="hidden" {...register("id")} />}

        <input type="hidden" {...register("enterpriseInsurerId")} />

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="code">SUSEP</Label>

              <Input
                id="code"
                type="text"
                placeholder="Ex.: CHME2J"
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
              <Label htmlFor="masterSusepId">SUSEP Master</Label>

              <Controller
                name="masterSusepId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={selectItems}
                    value={field.value ?? "none"}
                    disabled={isLoadingSuseps}
                    onValueChange={(value) => {
                      field.onChange(
                        value === "none" || value === null ? null : value,
                      );
                    }}
                  >
                    <SelectTrigger
                      id="masterSusepId"
                      className="w-full"
                      aria-invalid={!!errors.masterSusepId}
                    >
                      <SelectValue placeholder="Selecione a SUSEP Master" />
                    </SelectTrigger>

                    <SelectContent>
                      {selectItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.masterSusepId && (
                <p className="text-xs text-destructive">
                  {errors.masterSusepId.message}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Deixe sem Master quando esta for uma SUSEP principal.
              </p>
            </div>

            <Controller
              name="multichannel"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />

                  <div className="grid gap-1">
                    <span className="text-sm font-medium">Multicanal</span>

                    <span className="text-xs text-muted-foreground">
                      Ative quando esta SUSEP utilizar distribuição multicanal
                      por produto e usuário responsável.
                    </span>
                  </div>
                </label>
              )}
            />

            {errors.multichannel && (
              <p className="text-xs text-destructive">
                {errors.multichannel.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isLoadingSuseps}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />

                {isEditing ? "Salvando..." : "Vinculando..."}
              </>
            ) : isEditing ? (
              "Salvar alterações"
            ) : (
              "Vincular SUSEP"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertSusepForm;
