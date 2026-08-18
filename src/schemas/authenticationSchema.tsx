import z from "zod";

const authenticationSchema = z.object({
  email: z
    .email({
      error: "O e-mail é invalido.",
    })
    .trim()
    .min(1, {
      error: "O e-mail é obrigatório.",
    }),
  password: z
    .string()
    .trim()
    .min(1, {
      error: "A senha é obrigatória.",
    })
    .min(6, {
      error: "Senha inválida.",
    }),
});

export type AuthenticationFormData = z.infer<typeof authenticationSchema>;

export default authenticationSchema;
