"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Controller, useForm, useWatch } from "react-hook-form";

import { createEnterpriseInsurerAction } from "@/src/actions/insurers/create-enterprise-insurer";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { FormSubmitButton } from "@/src/components/ui/form-submit-button";
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
import createEnterpriseInsurerSchema, {
  type CreateEnterpriseInsurerFormData,
} from "@/src/schemas/insurer/createEnterpriseInsurerSchema";

type Option = {
  id: string;
  name: string;
};

type ExistingLink = {
  insurerId: string;
  enterpriseId: string;
};

type UpsertEnterpriseInsurerFormProps = {
  insurers: Option[];
  enterprises: Option[];
  existingLinks: ExistingLink[];
  onSuccess: () => void;
};

const UpsertEnterpriseInsurerForm = ({
  insurers,
  enterprises,
  existingLinks,
  onSuccess,
}: UpsertEnterpriseInsurerFormProps) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateEnterpriseInsurerFormData>({
    resolver: zodResolver(createEnterpriseInsurerSchema),
    defaultValues: {
      insurerId: "",
      enterpriseId: "",
    },
    mode: "onBlur",
  });

  const selectedInsurerId = useWatch({
    control,
    name: "insurerId",
  });

  const availableEnterprises = selectedInsurerId
    ? enterprises.filter((enterprise) => {
        return !existingLinks.some(
          (link) =>
            link.insurerId === selectedInsurerId &&
            link.enterpriseId === enterprise.id,
        );
      })
    : [];

  const insurerItems = insurers.map((insurer) => ({
    value: insurer.id,
    label: insurer.name,
  }));

  const enterpriseItems = availableEnterprises.map((enterprise) => ({
    value: enterprise.id,
    label: enterprise.name,
  }));

  const { execute, isPending } = useAction(createEnterpriseInsurerAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Seguradora vinculada",
        description: "Seguradora vinculada à empresa com sucesso!",
      });

      reset();
      router.refresh();
      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao vincular seguradora",
        description:
          error.serverError ?? "Não foi possível realizar o vínculo.",
      });
    },
  });

  const onSubmit = (data: CreateEnterpriseInsurerFormData) => {
    execute(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Vincular seguradora</DialogTitle>

        <DialogDescription>
          Selecione a seguradora e a empresa que receberá o vínculo.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="insurerId">Seguradora</Label>

              <Controller
                name="insurerId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={insurerItems}
                    value={field.value ?? null}
                    onValueChange={(value) => {
                      if (value === null) {
                        return;
                      }

                      field.onChange(value);
                      setValue("enterpriseId", "");
                    }}
                  >
                    <SelectTrigger
                      id="insurerId"
                      className="w-full"
                      aria-invalid={!!errors.insurerId}
                    >
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
                )}
              />

              {errors.insurerId && (
                <p className="text-xs text-destructive">
                  {errors.insurerId.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="enterpriseId">Empresa</Label>

              <Controller
                name="enterpriseId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={enterpriseItems}
                    value={field.value ?? null}
                    disabled={
                      !selectedInsurerId || enterpriseItems.length === 0
                    }
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.onChange(value);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="enterpriseId"
                      className="w-full"
                      aria-invalid={!!errors.enterpriseId}
                    >
                      <SelectValue
                        placeholder={
                          !selectedInsurerId
                            ? "Selecione primeiro a seguradora"
                            : enterpriseItems.length === 0
                              ? "Nenhuma empresa disponível"
                              : "Selecione uma empresa"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {enterpriseItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.enterpriseId && (
                <p className="text-xs text-destructive">
                  {errors.enterpriseId.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <FormSubmitButton
            isPending={isPending}
            idleLabel="Vincular seguradora"
            pendingLabel="Vinculando..."
          />
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertEnterpriseInsurerForm;
