"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";

import UpsertUserForm from "./upsert-user-form";

const AddUserButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button">
            <PlusIcon />
            Novo Usuário
          </Button>
        }
      />

      <UpsertUserForm onSuccess={() => setOpen(false)} />
    </Dialog>
  );
};

export default AddUserButton;
