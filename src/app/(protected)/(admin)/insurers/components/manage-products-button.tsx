"use client";

import { PackageIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";

import ManageProductsDialog from "../../components/products/manage-products-dialog";
import type { ProductInsurerOption } from "../../components/products/types";

interface ManageProductsButtonProps {
  insurers: ProductInsurerOption[];
}

const ManageProductsButton = ({ insurers }: ManageProductsButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            <PackageIcon className="size-4" />
            Gerenciar produtos
          </Button>
        }
      />

      <ManageProductsDialog open={open} insurers={insurers} />
    </Dialog>
  );
};

export default ManageProductsButton;
