import { z } from "zod";

import { statuses, userRoles } from "@/src/constants/enums";

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      error: "O nome é obrigatório.",
    })
    .max(50, {
      error: "O nome não pode ter mais de 50 caracteres.",
    }),
  phone: z
    .string()
    .trim()
    .min(1, {
      error: "O telefone é obrigatório.",
    })
    .regex(/^\d{10,15}$/, {
      error: "Informe um telefone válido com 10 a 15 dígitos.",
    }),
  email: z
    .string()
    .trim()
    .min(1, {
      error: "O e-mail é obrigatório.",
    })
    .pipe(
      z.email({
        error: "O e-mail é inválido.",
      }),
    ),
  password: z
    .string()
    .min(1, {
      error: "A senha é obrigatória.",
    })
    .min(8, {
      error: "A senha deve ter pelo menos 8 caracteres.",
    })
    .max(128, {
      error: "A senha não pode ter mais de 128 caracteres.",
    }),
  role: z.enum(userRoles, {
    error: "Selecione uma função.",
  }),
  status: z.enum(statuses, {
    error: "Selecione um status.",
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export default createUserSchema;
