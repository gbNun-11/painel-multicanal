import { z } from "zod";

import { userRoles } from "@/src/constants/enums";
import { hasAllowedEmailDomain } from "@/src/utils/auth-policy";
import { isValidCpf } from "@/src/utils/documents";

const getTodayDateString = () => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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

    cpf: z
      .string()
      .length(11, {
        error: "O CPF deve conter 11 números.",
      })
      .regex(/^\d+$/, {
        error: "O CPF deve conter apenas números.",
      })
      .refine(isValidCpf, {
        error: "Informe um CPF válido.",
      }),

    birthDate: z
      .string()
      .min(1, {
        error: "Informe a data de nascimento.",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        error: "Informe uma data de nascimento válida.",
      })
      .refine(
        (value) => {
          const [year, month, day] = value.split("-").map(Number);

          const date = new Date(Date.UTC(year, month - 1, day));

          return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
          );
        },
        {
          error: "Informe uma data de nascimento válida.",
        },
      )
      .refine((value) => value <= getTodayDateString(), {
        error: "A data de nascimento não pode estar no futuro.",
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

    // ID externo do Goalfy, opcional; não presumir que seja um UUID.
    goalfyUserId: z
      .string()
      .trim()
      .max(120, {
        error: "O ID Goalfy deve ter no máximo 120 caracteres.",
      })
      .optional(),

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
