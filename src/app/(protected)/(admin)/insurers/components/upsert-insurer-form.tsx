"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Controller, useForm } from "react-hook-form";

import { createInsurerAction } from "@/src/actions/insurers/create-insurer";
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
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/toast";
import upsertInsurerSchema, {
  type UpsertInsurerFormData,
} from "@/src/schemas/insurer/upsertInsurerSchema";

interface UpsertInsurerFormProps {
  onSuccess: () => void;
}

const UpsertInsurerForm = ({ onSuccess }: UpsertInsurerFormProps) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpsertInsurerFormData>({
    resolver: zodResolver(upsertInsurerSchema),

    defaultValues: {
      name: "",
    },

    mode: "onBlur",
  });

  const { execute, isPending } = useAction(createInsurerAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Seguradora criada",
        description: "Seguradora cadastrada com sucesso!",
      });

      reset();

      router.refresh();

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao criar seguradora",
        description:
          error.serverError ?? "Não foi possível cadastrar a seguradora.",
      });
    },
  });

  const onSubmit = (data: UpsertInsurerFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova seguradora</DialogTitle>

        <DialogDescription>
          Cadastre uma nova seguradora no sistema.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  placeholder="Digite o nome da seguradora"
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  {...field}
                />
              )}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <FormSubmitButton
            isPending={isPending}
            idleLabel="Cadastrar seguradora"
            pendingLabel="Cadastrando..."
          />
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertInsurerForm;
