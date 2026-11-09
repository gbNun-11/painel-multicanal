"use client";

import { MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

interface TableRowActionsProps {
  label: string;
  children: ReactNode;
  disabled?: boolean;
}

export function TableRowActions({
  label,
  children,
  disabled = false,
}: TableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={label}
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        }
      />

      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
