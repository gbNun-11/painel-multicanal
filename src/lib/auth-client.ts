import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/src/lib/auth";

import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),

    adminClient({
      ac,
      roles: {
        admin: roles.admin,
        administrativo: roles.administrativo,
        comercial: roles.comercial,
      },
    }),
  ],
});
