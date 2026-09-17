import { INSURER_IDS } from "@/src/constants/insurers";

import ClientsPage from "../components/clients-page";
import type { ClientsSearchParams } from "../components/types";

interface ZaionClientsPageProps {
  searchParams: Promise<ClientsSearchParams>;
}

const ZaionClientsPage = ({ searchParams }: ZaionClientsPageProps) => {
  return (
    <ClientsPage
      searchParams={searchParams}
      insurerId={INSURER_IDS.ZAION}
      pathname="/clients/zaion"
      title="Clientes Zaion Ads"
      description="Gestão de clientes da Zaion Ads."
      syncLabel="Sincronizar Zaion"
    />
  );
};

export default ZaionClientsPage;
