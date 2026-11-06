import { Badge } from "@/src/components/ui/badge";
import { type Status, statusLabels } from "@/src/constants/enums";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status === "ativo" ? "default" : "secondary"}>
      {statusLabels[status]}
    </Badge>
  );
}
