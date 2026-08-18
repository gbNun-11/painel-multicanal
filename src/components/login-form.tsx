import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { CardContent, CardFooter } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import authenticationSchema, {
  type AuthenticationFormData,
} from "@/src/schemas/authenticationSchema";

const LoginForm = () => {
  const methods = useForm<AuthenticationFormData>({
    resolver: zodResolver(authenticationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const handleSubmit = (data: AuthenticationFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={methods.handleSubmit(handleSubmit)}>
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
              <p className="text-sm text-destructive">
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
              <p className="text-sm text-destructive">
                {methods.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col pt-4">
        <Button type="submit" className="w-full">
          Login
        </Button>
      </CardFooter>
    </form>
  );
};

export default LoginForm;
