"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";

import ManageMultichannelDialog from "../multichannel/manage-multichannel-dialog";
import { Button } from "@/src/components/ui/button";
import { Dialog } from "@/src/components/ui/dialog";

interface ConfigureMultichannelButtonProps {
  susepId: string;

  susepCode: string;

  enterpriseName: string;

  insurerName: string;
}

const ConfigureMultichannelButton = ({
  susepId,
  susepCode,
  enterpriseName,
  insurerName,
}: ConfigureMultichannelButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Configurar multicanal"
        aria-label={`Configurar multicanal da SUSEP ${susepCode}`}
        onClick={() => {
          setOpen(true);
        }}
      >
        <SlidersHorizontalIcon className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <ManageMultichannelDialog
          open={open}
          susepId={susepId}
          susepCode={susepCode}
          enterpriseName={enterpriseName}
          insurerName={insurerName}
        />
      </Dialog>
    </>
  );
};

export default ConfigureMultichannelButton;
