"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Progress } from "@/src/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { GoalfyCommercialUser } from "@/src/data/clients/goalfy-import-types";
import type { GoalfySelectedImportRunner } from "@/src/data/clients/goalfy-selected-import-types";

interface GoalfySelectedImportDialogProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  selectedClientIds: string[];

  commercialUsers: GoalfyCommercialUser[];

  onImport: GoalfySelectedImportRunner;
}

const GoalfySelectedImportDialog = ({
  open,
  onOpenChange,
  selectedClientIds,
  commercialUsers,
  onImport,
}: GoalfySelectedImportDialogProps) => {
  const [salespersonId, setSalespersonId] = useState("");

  const [sendListByWhatsApp, setSendListByWhatsApp] = useState(false);

  const [sendListByEmail, setSendListByEmail] = useState(false);

  const [isImporting, setIsImporting] = useState(false);

  const [completedImports, setCompletedImports] = useState(0);

  const [totalImports, setTotalImports] = useState(0);

  const commercialUserItems = useMemo(
    () =>
      commercialUsers.map((user) => ({
        value: user.id,

        label: user.name,
      })),
    [commercialUsers],
  );

  const resetDialog = () => {
    setSalespersonId("");

    setSendListByWhatsApp(false);

    setSendListByEmail(false);

    setCompletedImports(0);

    setTotalImports(0);
  };

  const handleImport = async () => {
    if (!salespersonId || selectedClientIds.length === 0) {
      return;
    }

    setIsImporting(true);

    setCompletedImports(0);

    setTotalImports(selectedClientIds.length);

    try {
      await onImport(
        {
          clientIds: selectedClientIds,

          salespersonId,

          sendListByWhatsApp,

          sendListByEmail,
        },

        (completed, total) => {
          setCompletedImports(completed);

          setTotalImports(total);
        },
      );

      resetDialog();

      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  const progress =
    totalImports > 0 ? Math.round((completedImports / totalImports) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Transferir clientes selecionados</DialogTitle>

          <DialogDescription>
            Os {selectedClientIds.length} cliente(s) selecionado(s) serão
            enviados exatamente como marcados na tabela.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">
              Clientes selecionados
            </div>

            <div className="mt-1 text-2xl font-semibold">
              {selectedClientIds.length}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Usuário comercial</Label>

            <Select
              items={commercialUserItems}
              value={salespersonId || null}
              onValueChange={(value) => setSalespersonId(value ?? "")}
              disabled={isImporting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o vendedor" />
              </SelectTrigger>

              <SelectContent>
                {commercialUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div>
              <DialogTitle>Envio da lista</DialogTitle>

              <DialogDescription>
                Escolha como a relação dos clientes distribuídos deve ser
                enviada ao vendedor.
              </DialogDescription>
            </div>

            <label
              htmlFor="selected-send-whatsapp"
              className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md border p-4"
            >
              <Checkbox
                id="selected-send-whatsapp"
                checked={sendListByWhatsApp}
                onCheckedChange={setSendListByWhatsApp}
                disabled={isImporting}
              />

              <span className="text-sm font-medium">
                Enviar lista por WhatsApp
              </span>
            </label>

            <label
              htmlFor="selected-send-email"
              className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md border p-4"
            >
              <Checkbox
                id="selected-send-email"
                checked={sendListByEmail}
                onCheckedChange={setSendListByEmail}
                disabled={isImporting}
              />

              <span className="text-sm font-medium">
                Enviar relatório por E-mail
              </span>
            </label>
          </div>

          {(isImporting || totalImports > 0) && (
            <div className="space-y-2">
              <Progress value={progress} />

              <div className="text-muted-foreground flex items-center justify-end gap-2 text-sm">
                {isImporting && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}

                <span>
                  {completedImports}/{totalImports}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetDialog();

              onOpenChange(false);
            }}
            disabled={isImporting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleImport}
            disabled={
              !salespersonId || selectedClientIds.length === 0 || isImporting
            }
          >
            Transferir {selectedClientIds.length} cliente(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalfySelectedImportDialog;
