export type SmtpAccountKey = "INRI" | "ICX";

export interface DistributionEmailClient {
  id: string;

  name: string;

  document: string | null;

  phone: string | null;

  email: string | null;

  product: string | null;

  salesModel: "LEAD" | "VINCULO" | "CONTINGENCIA" | null;

  propensity: string | null;

  sourceCreatedAt: Date | null;

  assignedAt: Date | null;
}

export interface SendDistributionEmailInput {
  smtpAccount: SmtpAccountKey;

  enterpriseName: string;

  sender: {
    name: string;
    email: string;
  };

  recipient: {
    name: string;
    email: string;
  };

  clients: DistributionEmailClient[];
}
