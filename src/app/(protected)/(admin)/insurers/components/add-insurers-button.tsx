"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";

import UpsertInsurerForm from "./upsert-insurer-form";

const AddInsurersButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button">
            <PlusIcon className="size-4" />
            Nova seguradora
          </Button>
        }
      />

      <UpsertInsurerForm
        onSuccess={() => {
          setOpen(false);
        }}
      />
    </Dialog>
  );
};

export default AddInsurersButton;
