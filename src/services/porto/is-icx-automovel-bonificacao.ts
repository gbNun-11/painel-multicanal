import { ENTERPRISE_IDS } from "@/src/constants/enterprises";

// Regra comercial específica da origem multicanal da Porto para a ICX.
// O CPF foi validado antes por resolvePortoMultichannelContext;
// aqui usamos o usuário identificado por aquele CPF, não o vendedor destino.
const normalize = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");

export const isIcxAutomovelBonificacao = ({
  enterpriseId,
  product,
  originUserName,
}: {
  enterpriseId: string;
  product: string;
  originUserName: string;
}) => {
  const name = normalize(originUserName);

  return (
    enterpriseId === ENTERPRISE_IDS.ICX &&
    normalize(product) === "AUTOMOVEL BONIFICACAO" &&
    (name === "MARCELLO REIS" || name === "MARCELO REIS")
  );
};
