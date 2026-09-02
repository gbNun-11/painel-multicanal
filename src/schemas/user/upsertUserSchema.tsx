import { z } from "zod";

import { userRoles } from "@/src/constants/enums";
import { hasAllowedEmailDomain } from "@/src/utils/auth-policy";

const upsertUserSchema = z
  .object({
    id: z.uuid().optional(),

    name: z
      .string()
      .trim()
      .min(1, {
        error: "Informe o nome.",
      })
      .max(50, {
        error: "O nome deve conter no máximo 50 caracteres.",
      }),

    phone: z
      .string()
      .min(10, {
        error: "O telefone deve conter pelo menos 10 números.",
      })
      .max(11, {
        error: "O telefone deve conter no máximo 11 números.",
      })
      .regex(/^\d+$/, {
        error: "O telefone deve conter apenas números.",
      }),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, {
        error: "Informe o e-mail.",
      })
      .pipe(
        z.email({
          error: "Informe um e-mail válido.",
        }),
      )
      .refine(hasAllowedEmailDomain, {
        error: "O e-mail deve pertencer ao domínio @inricorretora.com.br.",
      }),

    password: z.string().max(128, {
      error: "A senha deve conter no máximo 128 caracteres.",
    }),

    role: z.enum(userRoles),
  })
  .superRefine((data, ctx) => {
    if (!data.id && data.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "A senha deve conter pelo menos 8 caracteres.",
      });

      return;
    }

    if (data.id && data.password.length > 0 && data.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "A nova senha deve conter pelo menos 8 caracteres.",
      });
    }
  });

export type UpsertUserFormData = z.infer<typeof upsertUserSchema>;

export default upsertUserSchema;
