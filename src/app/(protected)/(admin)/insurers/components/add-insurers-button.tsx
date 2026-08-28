"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/src/components/ui/dialog";

const AddInsurersButton = () => {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Nova Seguradora
          </Button>
        }
      ></DialogTrigger>
      <DialogContent></DialogContent>
    </Dialog>
  );
};

export default AddInsurersButton;
