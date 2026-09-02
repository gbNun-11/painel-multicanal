import { AUTH_EMAIL_DOMAIN, LOGIN_ALLOWED_ROLES } from "@/src/constants/auth";

export const hasAllowedEmailDomain = (email: string) => {
  return email.trim().toLowerCase().endsWith(`@${AUTH_EMAIL_DOMAIN}`);
};

export const hasAllowedLoginRole = (role: string | null | undefined) => {
  if (!role) {
    return false;
  }

  return LOGIN_ALLOWED_ROLES.some((allowedRole) => allowedRole === role);
};
