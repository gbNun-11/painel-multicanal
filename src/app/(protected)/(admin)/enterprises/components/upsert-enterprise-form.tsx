"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { createEnterpriseAction } from "@/src/actions/enterprises/create-enterprise";
import { updateEnterpriseAction } from "@/src/actions/enterprises/update-enterprise";
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
import upsertEnterpriseSchema, {
  type UpsertEnterpriseFormData,
} from "@/src/schemas/enterprise/upsertEnterprisesSchema";
import { normalizeCnpj } from "@/src/utils/documents";
import { formatCnpj } from "@/src/utils/formatters";

import type { EnterpriseTableRow } from "./types";

type UpsertEnterpriseFormProps = {
  enterprise?: EnterpriseTableRow;
  onSuccess: () => void;
};

const getDefaultValues = (enterprise?: EnterpriseTableRow) => ({
  name: enterprise?.name ?? "",
  cnpj: enterprise?.cnpj ?? "",
});

const UpsertEnterpriseForm = ({
  enterprise,
  onSuccess,
}: UpsertEnterpriseFormProps) => {
  const router = useRouter();

  const isEditing = Boolean(enterprise);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpsertEnterpriseFormData>({
    resolver: zodResolver(upsertEnterpriseSchema),
    defaultValues: getDefaultValues(enterprise),
    mode: "onBlur",
  });

  useEffect(() => {
    reset(getDefaultValues(enterprise));
  }, [enterprise, reset]);

  const { execute: executeCreate, isPending: isCreating } = useAction(
    createEnterpriseAction,
    {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: "Empresa criada",
          description: "Empresa criada com sucesso!",
        });

        reset(getDefaultValues());

        router.refresh();
        onSuccess();
      },

      onError: ({ error }) => {
        toast.add({
          type: "error",
          title: "Erro ao criar empresa",
          description: error.serverError ?? "Não foi possível criar a empresa.",
        });
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useAction(
    updateEnterpriseAction,
    {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: "Empresa atualizada",
          description: "Empresa atualizada com sucesso!",
        });

        router.refresh();
        onSuccess();
      },

      onError: ({ error }) => {
        toast.add({
          type: "error",
          title: "Erro ao atualizar empresa",
          description:
            error.serverError ?? "Não foi possível atualizar a empresa.",
        });
      },
    },
  );

  const isPending = isCreating || isUpdating;

  const onSubmit = (data: UpsertEnterpriseFormData) => {
    if (enterprise) {
      executeUpdate({
        id: enterprise.id,
        name: data.name,
        cnpj: data.cnpj,
      });

      return;
    }

    executeCreate({
      name: data.name,
      cnpj: data.cnpj,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar empresa" : "Criar nova empresa"}
        </DialogTitle>

        <DialogDescription>
          {isEditing
            ? "Atualize os dados da empresa."
            : "Cadastre uma nova empresa no sistema."}
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da empresa</Label>

              <Input
                id="name"
                type="text"
                placeholder="Nome da empresa"
                autoComplete="organization"
                aria-invalid={!!errors.name}
                {...register("name")}
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>

              <Controller
                name="cnpj"
                control={control}
                render={({ field }) => (
                  <Input
                    id="cnpj"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formatCnpj(field.value ?? "")}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={!!errors.cnpj}
                    onChange={(event) => {
                      const normalized = normalizeCnpj(event.target.value);

                      const base = normalized.slice(0, 12);

                      const checkDigits = normalized
                        .slice(12)
                        .replace(/\D/g, "")
                        .slice(0, 2);

                      field.onChange(`${base}${checkDigits}`);
                    }}
                  />
                )}
              />

              {errors.cnpj && (
                <p className="text-xs text-destructive">
                  {errors.cnpj.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />

                {isEditing ? "Salvando alterações..." : "Criando empresa..."}
              </>
            ) : isEditing ? (
              "Salvar alterações"
            ) : (
              "Criar empresa"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertEnterpriseForm;
