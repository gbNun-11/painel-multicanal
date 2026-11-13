import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  negative?: boolean;
}

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  description,
  negative = false,
}: SummaryCardProps) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={
            negative
              ? "rounded-full bg-destructive/10 p-1.5 text-destructive"
              : "rounded-full bg-primary/10 p-1.5 text-primary"
          }
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="mt-auto space-y-1">
      <p
        className={
          negative
            ? "text-2xl font-semibold tracking-tight text-destructive tabular-nums"
            : "text-2xl font-semibold tracking-tight tabular-nums"
        }
      >
        {value}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

export default SummaryCard;
