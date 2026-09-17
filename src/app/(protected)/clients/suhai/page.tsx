import { INSURER_IDS } from "@/src/constants/insurers";

import ClientsPage from "../components/clients-page";
import type { ClientsSearchParams } from "../components/types";

interface SuhaiClientsPageProps {
  searchParams: Promise<ClientsSearchParams>;
}

const SuhaiClientsPage = ({ searchParams }: SuhaiClientsPageProps) => {
  return (
    <ClientsPage
      searchParams={searchParams}
      insurerId={INSURER_IDS.SUHAI}
      pathname="/clients/suhai"
      title="Clientes Suhai"
      description="Gestão de clientes da Suhai Seguradora."
      syncLabel="Sincronizar Suhai"
    />
  );
};

export default SuhaiClientsPage;
