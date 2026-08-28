import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

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
import { statuses } from "@/src/constants/enums";
import createEnterpriseSchema, {
  type CreateEnterpriseFormData,
} from "@/src/schemas/enterprisesSchema";

type UpsertEnterpriseFormProps = {
  onSuccess: () => void;
};
const statusLabels: Record<CreateEnterpriseFormData["status"], string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

const statusItems = statuses.map((status) => ({
  value: status,
  label: statusLabels[status],
}));

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const UpsertEnterpriseForm = ({ onSuccess }: UpsertEnterpriseFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseSchema),

    defaultValues: {
      name: "",
      cnpj: "",
      status: "ativo",
    },

    mode: "onBlur",
  });

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    try {
      const response = await fetch("/api/enterprises", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.add({
          type: "error",
          title: "Erro ao criar empresa",
          description:
            "Não foi possível criar a empresa. Verifique os dados e tente novamente.",
        });

        return;
      }

      toast.add({
        type: "success",
        title: "Empresa criada",
        description: "Empresa criada com sucesso!",
      });

      reset();

      onSuccess();
    } catch {
      toast.add({
        type: "error",
        title: "Erro de conexão",
        description:
          "Não foi possível se comunicar com o servidor. Tente novamente.",
      });
    }
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
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
