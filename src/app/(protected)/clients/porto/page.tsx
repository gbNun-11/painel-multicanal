import { INSURER_IDS } from "@/src/constants/insurers";

import ClientsPage from "../components/clients-page";
import type { ClientsSearchParams } from "../components/types";

interface PortoClientsPageProps {
  searchParams: Promise<ClientsSearchParams>;
}

const PortoClientsPage = ({ searchParams }: PortoClientsPageProps) => {
  return (
    <ClientsPage
      searchParams={searchParams}
      insurerId={INSURER_IDS.PORTO}
      pathname="/clients/porto"
      title="Clientes Porto"
      description="Gestão de clientes da Porto Seguro."
      syncLabel="Sincronizar Porto"
    />
  );
};

export default PortoClientsPage;
