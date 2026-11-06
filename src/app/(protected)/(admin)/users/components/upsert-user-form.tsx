"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";

import {
  getUserGoalfyIdAction,
  saveUserGoalfyIdAction,
} from "@/src/actions/users/goalfy-user-id";
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
import { formatCpf, formatPhone } from "@/src/utils/formatters";

import type { UserTableRow } from "./types";

type UpsertUserFormProps = {
  user?: UserTableRow;
  onSuccess: () => void;
};

const getDefaultValues = (user?: UserTableRow) => ({
  id: user?.id,
  name: user?.name ?? "",
  cpf: user?.cpf ?? "",
  birthDate: user?.birthDate ?? "",
  phone: user?.phone ?? "",
  email: user?.email ?? "",
  password: "",
  goalfyUserId: "",
  role: user?.role,
});

const UpsertUserForm = ({ user, onSuccess }: UpsertUserFormProps) => {
  const router = useRouter();

  const isEditing = Boolean(user);
  const [loadingGoalfyId, setLoadingGoalfyId] = useState(Boolean(user));
  const [goalfyLoadError, setGoalfyLoadError] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpsertUserFormData>({
    resolver: zodResolver(upsertUserSchema),

    defaultValues: getDefaultValues(user),

    mode: "onBlur",
  });

  useEffect(() => {
    let active = true;
    reset(getDefaultValues(user));
    setGoalfyLoadError(false);

    if (!user) {
      setLoadingGoalfyId(false);
      return;
    }

    setLoadingGoalfyId(true);

    void getUserGoalfyIdAction({ userId: user.id })
      .then((result) => {
        if (!active) return;
        if (!result?.data) {
          setGoalfyLoadError(true);
          return;
        }
        setValue("goalfyUserId", result.data.goalfyUserId ?? "");
      })
      .catch(() => {
        if (active) setGoalfyLoadError(true);
      })
      .finally(() => {
        if (active) setLoadingGoalfyId(false);
      });

    return () => {
      active = false;
    };
  }, [user, reset, setValue]);

  const closeDialog = () => {
    onSuccess();
  };

  const saveGoalfyId = async (userId: string, value: string | undefined) => {
    const response = await saveUserGoalfyIdAction({
      userId,
      goalfyUserId: value?.trim() || null,
    });

    if (response?.data?.success) return true;

    toast.add({
      type: "error",
      title: "ID Goalfy não salvo",
      description:
        "O cadastro do usuário pode ter sido salvo, mas o vínculo Goalfy não foi atualizado. Confira se o ID já pertence a outro usuário.",
    });

    return false;
  };

  const createUser = async (data: UpsertUserFormData) => {
    const { data: created, error } = await authClient.admin.createUser({
      name: data.name,

      email: data.email,

      password: data.password,

      role: data.role,

      data: {
        cpf: data.cpf,

        birthDate: data.birthDate,

        phone: data.phone,

        status: "ativo",
      },
    });

    if (!error) {
      if (!data.goalfyUserId?.trim()) return true;

      const newUserId = created?.user?.id;
      if (!newUserId) {
        toast.add({
          type: "error",
          title: "Vínculo Goalfy pendente",
          description:
            "Usuário criado, mas não foi possível identificar o UUID retornado para salvar o ID Goalfy.",
        });
        return false;
      }

      return saveGoalfyId(newUserId, data.goalfyUserId);
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

      closeDialog();

      return false;
    }

    toast.add({
      type: "error",

      title: "Erro ao criar usuário",

      description:
        error.message ||
        "Não foi possível criar o usuário. Verifique os dados e tente novamente.",
    });

    closeDialog();

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

        cpf: data.cpf,

        birthDate: data.birthDate,

        email: data.email,

        phone: data.phone,
      },
    });

    if (updateError) {
      toast.add({
        type: "error",

        title: "Erro ao atualizar usuário",

        description:
          updateError.message ||
          "Não foi possível atualizar os dados do usuário.",
      });

      closeDialog();

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

          description:
            roleError.message ||
            "Não foi possível alterar a função do usuário.",
        });

        closeDialog();

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

          description:
            passwordError.message ||
            "Não foi possível alterar a senha do usuário.",
        });

        closeDialog();

        return false;
      }
    }

    return saveGoalfyId(user.id, data.goalfyUserId);
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

      closeDialog();
    } catch {
      toast.add({
        type: "error",

        title: isEditing
          ? "Erro ao atualizar usuário"
          : "Erro ao criar usuário",

        description:
          "Não foi possível se comunicar com o servidor. Tente novamente.",
      });

      closeDialog();
    }
  };

  const onInvalid = (errors: FieldErrors<UpsertUserFormData>) => {
    const firstError = Object.values(errors).find((error) => error?.message);

    toast.add({
      type: "error",

      title: "Verifique os dados",

      description:
        typeof firstError?.message === "string"
          ? firstError.message
          : "Existem campos inválidos no formulário.",
    });
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

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        {isEditing && <input type="hidden" {...register("id")} />}

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
              <Label htmlFor="cpf">CPF</Label>

              <Controller
                name="cpf"
                control={control}
                render={({ field }) => (
                  <Input
                    id="cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={formatCpf(field.value ?? "")}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={!!errors.cpf}
                    onChange={(event) => {
                      const rawValue = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);

                      field.onChange(rawValue);
                    }}
                  />
                )}
              />

              {errors.cpf && (
                <p className="text-xs text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>

              <Input
                id="birthDate"
                type="date"
                autoComplete="bday"
                aria-invalid={!!errors.birthDate}
                {...register("birthDate")}
              />

              {errors.birthDate && (
                <p className="text-xs text-destructive">
                  {errors.birthDate.message}
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

            <div className="grid gap-2">
              <Label htmlFor="goalfyUserId">
                ID do usuário no Goalfy (opcional)
              </Label>
              <Input
                id="goalfyUserId"
                type="text"
                placeholder="Cole o ID do usuário no Goalfy"
                autoComplete="off"
                maxLength={120}
                disabled={loadingGoalfyId || goalfyLoadError}
                aria-invalid={!!errors.goalfyUserId || goalfyLoadError}
                {...register("goalfyUserId")}
              />
              {loadingGoalfyId && (
                <p className="text-xs text-muted-foreground">
                  Carregando ID Goalfy...
                </p>
              )}
              {goalfyLoadError && (
                <p className="text-xs text-destructive">
                  Não foi possível carregar o ID atual. Feche e abra a edição
                  novamente.
                </p>
              )}
              {errors.goalfyUserId && (
                <p className="text-xs text-destructive">
                  {errors.goalfyUserId.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Preenchimento manual. Deixe vazio para não vincular este usuário
                ao Goalfy.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loadingGoalfyId || goalfyLoadError}
          >
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
