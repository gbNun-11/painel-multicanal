"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { userRoleItems } from "@/src/constants/enums";
import { authClient } from "@/src/lib/auth-client";
import upsertUserSchema, {
  type UpsertUserFormData,
} from "@/src/schemas/user/upsertUserSchema";
import { formatPhone } from "@/src/utils/formatters";

import type { UserTableRow } from "./types";

type UpsertUserFormProps = {
  user?: UserTableRow;
  onSuccess: () => void;
};

const getDefaultValues = (user?: UserTableRow) => ({
  id: user?.id,
  name: user?.name ?? "",
  phone: user?.phone ?? "",
  email: user?.email ?? "",
  password: "",
  role: user?.role,
});

const UpsertUserForm = ({ user, onSuccess }: UpsertUserFormProps) => {
  const router = useRouter();

  const isEditing = Boolean(user);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertUserFormData>({
    resolver: zodResolver(upsertUserSchema),
    defaultValues: getDefaultValues(user),
    mode: "onBlur",
  });

  useEffect(() => {
    reset(getDefaultValues(user));
  }, [user, reset]);

  const createUser = async (data: UpsertUserFormData) => {
    const { error } = await authClient.admin.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,

      data: {
        phone: data.phone,
        status: "ativo",
      },
    });

    if (!error) {
      return true;
    }

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

      return false;
    }

    toast.add({
      type: "error",
      title: "Erro ao criar usuário",
      description:
        "Não foi possível criar o usuário. Verifique os dados e tente novamente.",
    });

    return false;
  };

  const updateUser = async (data: UpsertUserFormData) => {
    if (!user) {
      return false;
    }

    const { error: updateError } = await authClient.admin.updateUser({
      userId: user.id,

      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    if (updateError) {
      toast.add({
        type: "error",
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar os dados do usuário.",
      });

      return false;
    }

    if (data.role !== user.role) {
      const { error: roleError } = await authClient.admin.setRole({
        userId: user.id,
        role: data.role,
      });

      if (roleError) {
        toast.add({
          type: "error",
          title: "Erro ao alterar função",
          description: "Não foi possível alterar a função do usuário.",
        });

        return false;
      }
    }

    if (data.password) {
      const { error: passwordError } = await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword: data.password,
      });

      if (passwordError) {
        toast.add({
          type: "error",
          title: "Erro ao alterar senha",
          description: "Não foi possível alterar a senha do usuário.",
        });

        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: UpsertUserFormData) => {
    try {
      const success = isEditing
        ? await updateUser(data)
        : await createUser(data);

      if (!success) {
        return;
      }

      toast.add({
        type: "success",
        title: isEditing ? "Usuário atualizado" : "Usuário criado",
        description: isEditing
          ? "Usuário atualizado com sucesso!"
          : "Usuário criado com sucesso!",
      });

      reset(getDefaultValues());

      router.refresh();
      onSuccess();
    } catch {
      toast.add({
        type: "error",
        title: isEditing
          ? "Erro ao atualizar usuário"
          : "Erro ao criar usuário",
        description:
          "Não foi possível se comunicar com o servidor. Tente novamente.",
      });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar usuário" : "Criar novo usuário"}
        </DialogTitle>

        <DialogDescription>
          {isEditing
            ? "Atualize os dados do usuário."
            : "Cadastre um novo usuário no sistema."}
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("id")} />

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

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    maxLength={15}
                    value={formatPhone(field.value ?? "")}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={!!errors.phone}
                    onChange={(event) => {
                      const rawValue = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);

                      field.onChange(rawValue);
                    }}
                  />
                )}
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
              <Label htmlFor="password">
                {isEditing ? "Nova senha" : "Senha"}
              </Label>

              <Input
                id="password"
                type="password"
                placeholder={
                  isEditing
                    ? "Deixe em branco para manter a senha atual"
                    : "********"
                }
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />

              {isEditing && !errors.password && (
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para manter a senha atual.
                </p>
              )}

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
                    items={userRoleItems}
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
                      {userRoleItems.map((item) => (
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
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />

                {isEditing ? "Salvando..." : "Criando usuário..."}
              </>
            ) : isEditing ? (
              "Salvar alterações"
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
