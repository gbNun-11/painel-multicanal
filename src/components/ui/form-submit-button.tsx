import { Loader2Icon } from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface FormSubmitButtonProps {
  isPending: boolean;
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
}

export function FormSubmitButton({
  isPending,
  idleLabel,
  pendingLabel,
  disabled = false,
}: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={isPending || disabled}
    >
      {isPending ? (
        <>
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
