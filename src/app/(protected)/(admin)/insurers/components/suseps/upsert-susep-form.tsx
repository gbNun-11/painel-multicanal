"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Controller, useForm } from "react-hook-form";

import { createSusepAction } from "@/src/actions/insurers/suseps/create-susep";
import { Button } from "@/src/components/ui/button";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "@/src/components/ui/toast";
import createSusepSchema, {
  type CreateSusepFormData,
} from "@/src/schemas/insurer/susep/createSusepSchema";

interface UpsertSusepFormProps {
  enterpriseInsurerId: string;
  insurerName: string;
  enterpriseName: string;
  onSuccess: () => void;
}

const UpsertSusepForm = ({
  enterpriseInsurerId,
  insurerName,
  enterpriseName,
  onSuccess,
}: UpsertSusepFormProps) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSusepFormData>({
    resolver: zodResolver(createSusepSchema),

    defaultValues: {
      enterpriseInsurerId,
      codes: "",
    },

    mode: "onBlur",
  });

  const { execute, isPending } = useAction(createSusepAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "SUSEPs vinculadas",
        description: "As SUSEPs foram vinculadas com sucesso!",
      });

      reset({
        enterpriseInsurerId,
        codes: "",
      });

      router.refresh();
      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao vincular SUSEP",
        description: error.serverError ?? "Não foi possível vincular a SUSEP.",
      });
    },
  });

  const onSubmit = (data: CreateSusepFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Vincular SUSEP</DialogTitle>

        <DialogDescription>
          Vincule uma ou mais SUSEPs à empresa e seguradora selecionadas.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="grid gap-3 rounded-md border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Seguradora</p>

          <p className="font-medium">{insurerName}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Empresa</p>

          <p className="font-medium">{enterpriseName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="codes">SUSEPs</Label>

            <Controller
              name="codes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="codes"
                  placeholder={"Informe uma ou mais SUSEPs"}
                  autoComplete="off"
                  aria-invalid={!!errors.codes}
                  className="min-h-32"
                />
              )}
            />

            {errors.codes && (
              <p className="text-xs text-destructive">{errors.codes.message}</p>
            )}

            <p className="text-xs text-muted-foreground">
              Separe as SUSEPs por vírgula, ponto e vírgula ou quebra de linha.
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              "Vincular SUSEPs"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertSusepForm;
