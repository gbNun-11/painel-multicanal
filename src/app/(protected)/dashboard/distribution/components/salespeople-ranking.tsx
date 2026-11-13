import { UsersRoundIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";
import { formatPersonName } from "@/src/utils/formatters";

type Salespeople = DistributionDashboardData["salespeople"];
const formatNumber = new Intl.NumberFormat("pt-BR");

const initialsFor = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0]?.slice(0, 2) ?? ""
  ).toLocaleUpperCase("pt-BR");
};

const SalespeopleRanking = ({ salespeople }: { salespeople: Salespeople }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <UsersRoundIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        Ranking de vendedores
      </CardTitle>
      <CardDescription>Distribuições confirmadas no mês.</CardDescription>
    </CardHeader>
    <CardContent className="max-h-80 space-y-3 overflow-y-auto">
      {salespeople.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma distribuição confirmada neste mês.
        </p>
      ) : (
        salespeople.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Avatar size="lg">
              {user.avatarUrl && (
                <AvatarImage
                  src={user.avatarUrl}
                  alt={formatPersonName(user.name)}
                />
              )}
              <AvatarFallback>{initialsFor(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium" title={user.name}>
                {formatPersonName(user.name)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {user.role === "comercial"
                  ? "Comercial"
                  : user.role === "admin"
                    ? "Administração"
                    : "Administrativo"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatNumber.format(user.distributed)} distrib.
            </span>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

export default SalespeopleRanking;
