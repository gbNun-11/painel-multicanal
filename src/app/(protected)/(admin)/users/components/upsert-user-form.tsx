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
import { statuses, userRoles } from "@/src/constants/enums";
import { authClient } from "@/src/lib/auth-client";
import createUserSchema, {
  type CreateUserFormData,
} from "@/src/schemas/createUserSchema";

type UpsertUserFormProps = {
  onSuccess: () => void;
};

const roleLabels: Record<CreateUserFormData["role"], string> = {
  admin: "Administrador",
  administrativo: "Administrativo",
  comercial: "Comercial",
};

const statusLabels: Record<CreateUserFormData["status"], string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

const roleItems = userRoles.map((role) => ({
  value: role,
  label: roleLabels[role],
}));

const statusItems = statuses.map((status) => ({
  value: status,
  label: statusLabels[status],
}));

const UpsertUserForm = ({ onSuccess }: UpsertUserFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),

    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      role: undefined,
      status: "ativo",
    },

    mode: "onBlur",
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const { error } = await authClient.admin.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,

        data: {
          phone: data.phone,
          status: data.status,
        },
      });

      if (error) {
        if (
          error.code === "USER_ALREADY_EXISTS" ||
          error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
        ) {
          toast.add({
            type: "error",
            title: "Erro ao criar usuário",
            description:
              "O e-mail informado já está em uso. Por favor, utilize outro e-mail.",
          });

          return;
        }

        toast.add({
          type: "error",
          title: "Erro ao criar usuário",
          description:
            "Não foi possível criar o usuário. Verifique os dados e tente novamente.",
        });

        return;
      }
      onSuccess();
      reset();

      toast.add({
        type: "success",
        title: "Usuário criado",
        description: "Usuário criado com sucesso!",
      });
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
        <DialogTitle>Criar novo usuário</DialogTitle>

        <DialogDescription>
          Cadastre um novo usuário no sistema.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>

              <Input
                id="name"
                type="text"
                placeholder="Nome do usuário"
                autoComplete="name"
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
              <Label htmlFor="phone">Telefone</Label>

              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="11999999999"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />

              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>

              <Input
                id="email"
                type="email"
                placeholder="email@inricorretora.com.br"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />

              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>

              <Input
                id="password"
                type="password"
                placeholder="********"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />

              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    items={roleItems}
                    value={field.value ?? null}
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.onChange(value);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="role"
                      className="w-full"
                      aria-invalid={!!errors.role}
                    >
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>

                    <SelectContent>
                      {roleItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
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
                Criando usuário...
              </>
            ) : (
              "Criar usuário"
            )}
          </Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
};

export default UpsertUserForm;
