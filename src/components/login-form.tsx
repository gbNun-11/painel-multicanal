"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/toast";
import authenticationSchema, {
  type AuthenticationFormData,
} from "@/src/schemas/authenticationSchema";

import { authClient } from "../lib/auth-client";

const LoginForm = () => {
  const router = useRouter();
  const methods = useForm<AuthenticationFormData>({
    resolver: zodResolver(authenticationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: AuthenticationFormData) => {
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: "Login Realizado",
            description: "Login realizado com sucesso!",
          });

          router.push("/dashboard");
          router.refresh();
        },
        onError: () => {
          toast.add({
            type: "error",
            title: "Falha no Login",
            description:
              "Não foi possível realizar o login. Verifique suas credenciais e tente novamente.",
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
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="text"
              placeholder="email@inricorretora.com.br"
              {...methods.register("email")}
            />
            {methods.formState.errors.email && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Senha</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...methods.register("password")}
            />
            {methods.formState.errors.password && (
              <p className="text-xs text-destructive">
                {methods.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={methods.formState.isSubmitting}
        >
          {methods.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Login"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default LoginForm;
