"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/src/components/ui/dialog";

const AddClientButton = () => {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Adicionar Cliente
          </Button>
        }
      ></DialogTrigger>
      <DialogContent></DialogContent>
    </Dialog>
  );
};

export default AddClientButton;
