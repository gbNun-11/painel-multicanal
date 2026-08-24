"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "@/src/components/ui/toast";
import createUserSchema, {
  type CreateUserFormData,
  userRoles,
  userStatuses,
} from "@/src/schemas/createUserSchema";

import { authClient } from "../lib/auth-client";

const SignupForm = () => {
  const methods = useForm<CreateUserFormData>({
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

  const statusItems = userStatuses.map((status) => ({
    value: status,
    label: statusLabels[status],
  }));

  const onSubmit = async (data: CreateUserFormData) => {
    await authClient.admin.createUser(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        data: {
          phone: data.phone,
          status: data.status,
        },
      },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: "Usuário criado",
            description: "Usuário criado com sucesso!",
          });

          methods.reset();
        },

        onError: (ctx) => {
          if (
            ctx.error.code === "USER_ALREADY_EXISTS" ||
            ctx.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
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
        },
      },
    );
  };

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>

            <Input
              id="name"
              type="text"
              placeholder="Nome do usuário"
              autoComplete="name"
              aria-invalid={!!methods.formState.errors.name}
              {...methods.register("name")}
            />

            {methods.formState.errors.name && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.name.message}
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
              aria-invalid={!!methods.formState.errors.phone}
              {...methods.register("phone")}
            />

            {methods.formState.errors.phone && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.phone.message}
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
              aria-invalid={!!methods.formState.errors.email}
              {...methods.register("email")}
            />

            {methods.formState.errors.email && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.email.message}
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
              aria-invalid={!!methods.formState.errors.password}
              {...methods.register("password")}
            />

            {methods.formState.errors.password && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Função</Label>

            <Controller
              name="role"
              control={methods.control}
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
                    aria-invalid={!!methods.formState.errors.role}
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

            {methods.formState.errors.role && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>

            <Controller
              name="status"
              control={methods.control}
              render={({ field }) => (
                <Select
                  items={statusItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="status"
                    className="w-full"
                    aria-invalid={!!methods.formState.errors.status}
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

            {methods.formState.errors.status && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.status.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col pt-6">
        <Button
          type="submit"
          className="w-full"
          disabled={methods.formState.isSubmitting}
        >
          {methods.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Criar usuário"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default SignupForm;
