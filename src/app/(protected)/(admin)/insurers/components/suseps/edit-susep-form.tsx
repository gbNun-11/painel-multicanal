"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Controller, useForm } from "react-hook-form";

import { updateSusepAction } from "@/src/actions/insurers/suseps/update-susep";
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
import updateSusepSchema, {
  type UpdateSusepFormData,
} from "@/src/schemas/insurer/susep/updateSusepSchema";

import type { SusepTableRow } from "./types";

interface EditSusepFormProps {
  susep: SusepTableRow;
  onSuccess: () => void;
}

const EditSusepForm = ({ susep, onSuccess }: EditSusepFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateSusepFormData>({
    resolver: zodResolver(updateSusepSchema),

    defaultValues: {
      id: susep.id,
      code: susep.code,
    },

    mode: "onBlur",
  });

  const { execute, isPending } = useAction(updateSusepAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "SUSEP atualizada",
        description: "A SUSEP foi atualizada com sucesso.",
      });

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao atualizar SUSEP",
        description: error.serverError ?? "Não foi possível atualizar a SUSEP.",
      });
    },
  });

  const onSubmit = (data: UpdateSusepFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar SUSEP</DialogTitle>

        <DialogDescription>
          Altere o código da SUSEP selecionada.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="code">SUSEP</Label>

            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="code"
                  autoComplete="off"
                  aria-invalid={!!errors.code}
                />
              )}
            />

            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default EditSusepForm;
