"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import createUserSchema, {
  type CreateUserFormData,
} from "@/src/schemas/createUserSchema";

const SignupForm = () => {
  const {
    register,
    control,
    handleSubmit,
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
    const payload = {
      ...data,

      phone: data.phone.replace(/\D/g, ""),
    };

    console.log(payload);
  };

  return (
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
              <p className="text-xs text-destructive">{errors.name.message}</p>
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
              <p className="text-xs text-destructive">{errors.phone.message}</p>
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
              <p className="text-xs text-destructive">{errors.email.message}</p>
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
                    <SelectItem value="administrativo">
                      administrativo
                    </SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="comercial">comercial</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="status"
                    className="w-full"
                    aria-invalid={!!errors.status}
                  >
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ativo">ativo</SelectItem>

                    <SelectItem value="inativo">inativo</SelectItem>
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

      <CardFooter className="flex-col pt-6">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando usuário..." : "Criar usuário"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default SignupForm;
