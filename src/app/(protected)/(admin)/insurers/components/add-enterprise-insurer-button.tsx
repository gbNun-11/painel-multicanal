"use client";

import { LinkIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";

import UpsertEnterpriseInsurerForm from "./upsert-enterprise-insurer-form";

type Option = {
  id: string;
  name: string;
};

type ExistingLink = {
  insurerId: string;
  enterpriseId: string;
};

type AddEnterpriseInsurerButtonProps = {
  insurers: Option[];
  enterprises: Option[];
  existingLinks: ExistingLink[];
};

const AddEnterpriseInsurerButton = ({
  insurers,
  enterprises,
  existingLinks,
}: AddEnterpriseInsurerButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button">
            <LinkIcon className="size-4" />
            Vincular seguradora
          </Button>
        }
      />

      <UpsertEnterpriseInsurerForm
        insurers={insurers}
        enterprises={enterprises}
        existingLinks={existingLinks}
        onSuccess={() => {
          setOpen(false);
        }}
      />
    </Dialog>
  );
};

export default AddEnterpriseInsurerButton;
