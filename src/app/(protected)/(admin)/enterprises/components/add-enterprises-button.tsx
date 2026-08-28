"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";

import UpsertEnterpriseForm from "./upsert-enterprise-form";

const CreateEnterpriseDialog = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Nova Empresa
          </Button>
        }
      />

      <UpsertEnterpriseForm onSuccess={() => setOpen(false)} />
    </Dialog>
  );
};

export default CreateEnterpriseDialog;
