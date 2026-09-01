"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Controller, useForm } from "react-hook-form";

import { createEnterpriseAction } from "@/src/actions/enterprises/create-enterprise";
import { formatCnpj } from "@/src/utils/formatters";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/toast";
import { statusItems } from "@/src/constants/enums";
import createEnterpriseSchema, {
  type CreateEnterpriseFormData,
} from "@/src/schemas/enterprise/createEnterprisesSchema";

type UpsertEnterpriseFormProps = {
  onSuccess: () => void;
};

const UpsertEnterpriseForm = ({ onSuccess }: UpsertEnterpriseFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseSchema),

    defaultValues: {
      name: "",
      cnpj: "",
      status: "ativo",
    },

    mode: "onBlur",
  });

  const { execute, isPending } = useAction(createEnterpriseAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Empresa criada",
        description: "Empresa criada com sucesso!",
      });

      reset();
      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao criar empresa",
        description: error.serverError ?? "Não foi possível criar a empresa.",
      });
    },
  });

  const onSubmit = (data: CreateEnterpriseFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Empresa</DialogTitle>

        <DialogDescription>
          Cadastre uma nova empresa no sistema.
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
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formatCnpj(field.value ?? "")}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={!!errors.cnpj}
                    onChange={(event) => {
                      const rawValue = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 14);

                      field.onChange(rawValue);
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

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    items={statusItems}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="status"
                      className="w-full"
                      aria-invalid={!!errors.status}
                    >
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>

                    <SelectContent>
                      {statusItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.status && (
                <p className="text-xs text-destructive">
                  {errors.status.message}
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
                Criando empresa...
              </>
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
