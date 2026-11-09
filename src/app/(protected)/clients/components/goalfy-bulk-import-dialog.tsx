"use client";

import { LoaderCircleIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AspectRatio } from "@/src/components/ui/aspect-ratio";
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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Progress } from "@/src/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type {
  GoalfyBulkImportBlockPayload,
  GoalfyBulkImportRunner,
  GoalfyBulkSalesModel,
  GoalfyImportOptions,
} from "@/src/data/clients/goalfy-import-types";

interface GoalfyBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: GoalfyImportOptions;
  onImport?: GoalfyBulkImportRunner;
}

interface SellerAllocationDraft {
  id: string;
  userId: string;
  quantity: string;
}

interface ImportBlockDraft {
  id: string;
  product: string;
  enterpriseInsurerId: string;
  salesModel: GoalfyBulkSalesModel | "";
  quantity: string;
  allocations: SellerAllocationDraft[];
}

const SALES_MODELS: Array<{
  value: GoalfyBulkSalesModel;
  label: string;
}> = [
  { value: "LEAD", label: "Lead" },
  { value: "VINCULO", label: "Vínculo" },
  { value: "CONTINGENCIA", label: "Contingência" },
];

const initialBlock: ImportBlockDraft = {
  id: "block-1",
  product: "",
  enterpriseInsurerId: "",
  salesModel: "",
  quantity: "",
  allocations: [
    {
      id: "allocation-1",
      userId: "",
      quantity: "",
    },
  ],
};

const parseQuantity = (value: string) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const GoalfyBulkImportDialog = ({
  open,
  onOpenChange,
  options,
  onImport,
}: GoalfyBulkImportDialogProps) => {
  const blockCounter = useRef(1);
  const allocationCounter = useRef(1);

  const [blocks, setBlocks] = useState<ImportBlockDraft[]>([initialBlock]);

  const [sendListByWhatsApp, setSendListByWhatsApp] = useState(false);

  const [sendListByEmail, setSendListByEmail] = useState(false);

  const [isImporting, setIsImporting] = useState(false);

  const [completedImports, setCompletedImports] = useState(0);

  const [totalImports, setTotalImports] = useState(0);

  const enterprises = useMemo(() => {
    const result = new Map<
      string,
      {
        enterpriseInsurerId: string;
        enterpriseName: string;
      }
    >();

    for (const item of options.availability) {
      if (!result.has(item.enterpriseInsurerId)) {
        result.set(item.enterpriseInsurerId, {
          enterpriseInsurerId: item.enterpriseInsurerId,
          enterpriseName: item.enterpriseName,
        });
      }
    }

    return [...result.values()];
  }, [options.availability]);

  const commercialUserItems = useMemo(
    () =>
      options.commercialUsers.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [options.commercialUsers],
  );

  const createAllocation = (): SellerAllocationDraft => {
    allocationCounter.current += 1;

    return {
      id: `allocation-${allocationCounter.current}`,
      userId: "",
      quantity: "",
    };
  };

  const createBlock = (): ImportBlockDraft => {
    blockCounter.current += 1;

    return {
      id: `block-${blockCounter.current}`,
      product: "",
      enterpriseInsurerId: "",
      salesModel: "",
      quantity: "",
      allocations: [createAllocation()],
    };
  };

  const resetDialog = () => {
    blockCounter.current = 1;
    allocationCounter.current = 1;

    setBlocks([
      {
        ...initialBlock,
        allocations: [
          {
            ...initialBlock.allocations[0],
          },
        ],
      },
    ]);

    setSendListByWhatsApp(false);
    setSendListByEmail(false);
    setCompletedImports(0);
    setTotalImports(0);
  };

  /**
   * Calcula o saldo disponível para um modelo de venda
   * no bloco atual.
   *
   * A quantidade disponível no banco é compartilhada
   * entre todos os blocos com:
   *
   * - mesma empresa/seguradora
   * - mesmo produto
   * - mesmo modelo de venda
   *
   * Desconta as quantidades reservadas nos OUTROS blocos.
   * Não desconta a quantidade do próprio bloco.
   *
   * Assim, o Bloco 1 pode reservar 2 VÍNCULOS,
   * enquanto o Bloco 2 mostrará 0 disponíveis.
   */
  const getRemainingForModel = (
    block: ImportBlockDraft,
    salesModel: GoalfyBulkSalesModel,
    currentBlocks: ImportBlockDraft[] = blocks,
  ): number => {
    if (!block.product || !block.enterpriseInsurerId) {
      return 0;
    }

    const available =
      options.availability.find(
        (item) =>
          item.product === block.product &&
          item.enterpriseInsurerId === block.enterpriseInsurerId &&
          item.salesModel === salesModel,
      )?.available ?? 0;

    const reservedByOtherBlocks = currentBlocks.reduce((total, other) => {
      if (
        other.id === block.id ||
        other.product !== block.product ||
        other.enterpriseInsurerId !== block.enterpriseInsurerId ||
        other.salesModel !== salesModel
      ) {
        return total;
      }

      return total + parseQuantity(other.quantity);
    }, 0);

    return Math.max(0, available - reservedByOtherBlocks);
  };

  const getAvailability = (block: ImportBlockDraft) => {
    if (!block.salesModel) {
      return null;
    }

    return (
      options.availability.find(
        (item) =>
          item.product === block.product &&
          item.enterpriseInsurerId === block.enterpriseInsurerId &&
          item.salesModel === block.salesModel,
      ) ?? null
    );
  };

  /**
   * O campo Quantidade utiliza o MESMO cálculo
   * dos cartões de modelo de venda.
   */
  const getMaximumForBlock = (
    block: ImportBlockDraft,
    currentBlocks: ImportBlockDraft[] = blocks,
  ) => {
    if (!block.salesModel) {
      return 0;
    }

    return getRemainingForModel(block, block.salesModel, currentBlocks);
  };

  const getProductsForBlock = (block: ImportBlockDraft) => {
    const values = new Set<string>();

    for (const item of options.availability) {
      if (
        block.enterpriseInsurerId &&
        item.enterpriseInsurerId !== block.enterpriseInsurerId
      ) {
        continue;
      }

      values.add(item.product);
    }

    return [...values].sort((a, b) => a.localeCompare(b, "pt-BR"));
  };

  const getEnterprisesForBlock = (block: ImportBlockDraft) => {
    if (!block.product) {
      return enterprises;
    }

    return enterprises.filter((enterprise) =>
      options.availability.some(
        (item) =>
          item.product === block.product &&
          item.enterpriseInsurerId === enterprise.enterpriseInsurerId,
      ),
    );
  };

  const updateBlock = (
    blockId: string,
    updater: (block: ImportBlockDraft) => ImportBlockDraft,
  ) => {
    setBlocks((current) =>
      current.map((block) => (block.id === blockId ? updater(block) : block)),
    );
  };

  const handleProductChange = (blockId: string, product: string | null) => {
    updateBlock(blockId, (block) => {
      const nextProduct = product ?? "";

      const enterpriseStillValid =
        !block.enterpriseInsurerId ||
        options.availability.some(
          (item) =>
            item.product === nextProduct &&
            item.enterpriseInsurerId === block.enterpriseInsurerId,
        );

      return {
        ...block,
        product: nextProduct,
        enterpriseInsurerId: enterpriseStillValid
          ? block.enterpriseInsurerId
          : "",
        salesModel: "",
        quantity: "",
        allocations: [createAllocation()],
      };
    });
  };

  const handleEnterpriseChange = (
    blockId: string,
    enterpriseInsurerId: string | null,
  ) => {
    updateBlock(blockId, (block) => {
      const nextEnterprise = enterpriseInsurerId ?? "";

      const productStillValid =
        !block.product ||
        options.availability.some(
          (item) =>
            item.product === block.product &&
            item.enterpriseInsurerId === nextEnterprise,
        );

      return {
        ...block,
        enterpriseInsurerId: nextEnterprise,
        product: productStillValid ? block.product : "",
        salesModel: "",
        quantity: "",
        allocations: [createAllocation()],
      };
    });
  };

  const handleSalesModelChange = (
    blockId: string,
    salesModel: GoalfyBulkSalesModel,
  ) => {
    updateBlock(blockId, (block) => ({
      ...block,
      salesModel,
      quantity: "",
      allocations: [createAllocation()],
    }));
  };

  const handleQuantityChange = (blockId: string, value: string) => {
    updateBlock(blockId, (block) => {
      const availability = getAvailability(block);

      if (!value) {
        return {
          ...block,
          quantity: "",
          allocations: block.allocations.map((allocation) => ({
            ...allocation,
            quantity: "",
          })),
        };
      }

      const parsed = parseQuantity(value);

      const maximum = availability ? getMaximumForBlock(block) : 0;

      const safeValue = Math.min(parsed, maximum);

      return {
        ...block,
        quantity: safeValue > 0 ? String(safeValue) : "",
      };
    });
  };

  const updateAllocation = (
    blockId: string,
    allocationId: string,
    updater: (allocation: SellerAllocationDraft) => SellerAllocationDraft,
  ) => {
    updateBlock(blockId, (block) => ({
      ...block,
      allocations: block.allocations.map((allocation) =>
        allocation.id === allocationId ? updater(allocation) : allocation,
      ),
    }));
  };

  const addAllocation = (blockId: string) => {
    updateBlock(blockId, (block) => ({
      ...block,
      allocations: [...block.allocations, createAllocation()],
    }));
  };

  const removeAllocation = (blockId: string, allocationId: string) => {
    updateBlock(blockId, (block) => ({
      ...block,
      allocations: block.allocations.filter(
        (allocation) => allocation.id !== allocationId,
      ),
    }));
  };

  const addBlock = () => {
    setBlocks((current) => [...current, createBlock()]);
  };

  const removeBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
  };

  const getDistributedQuantity = (block: ImportBlockDraft) => {
    return block.allocations.reduce(
      (total, allocation) => total + parseQuantity(allocation.quantity),
      0,
    );
  };

  const isBlockValid = (block: ImportBlockDraft) => {
    const availability = getAvailability(block);

    if (!availability) {
      return false;
    }

    const quantity = parseQuantity(block.quantity);

    if (quantity <= 0 || quantity > getMaximumForBlock(block)) {
      return false;
    }

    const userIds = block.allocations
      .map((allocation) => allocation.userId)
      .filter(Boolean);

    if (userIds.length !== block.allocations.length) {
      return false;
    }

    if (new Set(userIds).size !== userIds.length) {
      return false;
    }

    if (
      block.allocations.some(
        (allocation) => parseQuantity(allocation.quantity) <= 0,
      )
    ) {
      return false;
    }

    return getDistributedQuantity(block) === quantity;
  };

  const formIsValid = blocks.length > 0 && blocks.every(isBlockValid);

  const buildPayload = (): GoalfyBulkImportBlockPayload[] => {
    return blocks.map((block) => ({
      enterpriseInsurerId: block.enterpriseInsurerId,
      product: block.product,
      salesModel: block.salesModel as GoalfyBulkSalesModel,
      quantity: parseQuantity(block.quantity),
      allocations: block.allocations.map((allocation) => ({
        userId: allocation.userId,
        quantity: parseQuantity(allocation.quantity),
      })),
    }));
  };

  const handleImport = async () => {
    if (!onImport || !formIsValid) {
      return;
    }

    setIsImporting(true);
    setCompletedImports(0);
    setTotalImports(0);

    try {
      await onImport(
        {
          blocks: buildPayload(),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importação em massa</DialogTitle>

          <DialogDescription>
            Configure os blocos de distribuição para transferência dos clientes
            para a Goalfy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {blocks.map((block, blockIndex) => {
            const availability = getAvailability(block);

            const maximum = getMaximumForBlock(block);

            const quantity = parseQuantity(block.quantity);

            const distributed = getDistributedQuantity(block);

            const remaining = Math.max(quantity - distributed, 0);

            const products = getProductsForBlock(block);

            const productItems = products.map((product) => ({
              value: product,
              label: product,
            }));

            const blockEnterprises = getEnterprisesForBlock(block);

            const enterpriseItems = blockEnterprises.map((enterprise) => ({
              value: enterprise.enterpriseInsurerId,
              label: enterprise.enterpriseName,
            }));

            return (
              <div key={block.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle>Bloco {blockIndex + 1}</DialogTitle>

                    <DialogDescription>
                      Defina origem, modelo de venda, quantidade e distribuição.
                    </DialogDescription>
                  </div>

                  {blocks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBlock(block.id)}
                      disabled={isImporting}
                    >
                      <Trash2Icon />

                      <span className="sr-only">Remover bloco</span>
                    </Button>
                  )}
                </div>

                {/* MODELO DE VENDA */}

                <div className="space-y-2">
                  <Label>Modelo de venda</Label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {SALES_MODELS.map((model) => {
                      // Agora o cartão utiliza o saldo
                      // depois das reservas dos outros blocos.
                      const available = getRemainingForModel(
                        block,
                        model.value,
                      );

                      const selected = block.salesModel === model.value;

                      const ready =
                        !!block.product && !!block.enterpriseInsurerId;

                      return (
                        <Button
                          key={model.value}
                          type="button"
                          variant="outline"
                          className={`h-auto min-h-20 w-full flex-col items-start gap-1 p-3 text-left ${
                            selected ? "border-primary bg-primary/10" : ""
                          }`}
                          aria-pressed={selected}
                          disabled={!ready || available === 0 || isImporting}
                          onClick={() =>
                            handleSalesModelChange(block.id, model.value)
                          }
                        >
                          <span className="font-medium">{model.label}</span>

                          <span className="text-muted-foreground text-xs">
                            {ready
                              ? `${available} disponível(is)`
                              : "Selecione produto e empresa"}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Produto</Label>

                    <Select
                      items={productItems}
                      value={block.product || null}
                      onValueChange={(value) =>
                        handleProductChange(block.id, value)
                      }
                      disabled={isImporting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>

                      <SelectContent>
                        {productItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Empresa</Label>

                    <Select
                      items={enterpriseItems}
                      value={block.enterpriseInsurerId || null}
                      onValueChange={(value) =>
                        handleEnterpriseChange(block.id, value)
                      }
                      disabled={isImporting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>

                      <SelectContent>
                        {enterpriseItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade</Label>

                    <Input
                      type="number"
                      min={1}
                      max={maximum}
                      value={block.quantity}
                      onChange={(event) =>
                        handleQuantityChange(block.id, event.target.value)
                      }
                      placeholder={
                        availability
                          ? `Máximo ${maximum}`
                          : "Selecione o modelo de venda"
                      }
                      disabled={!availability || maximum === 0 || isImporting}
                    />
                  </div>
                </div>

                {availability && quantity > maximum && (
                  <DialogDescription>
                    A quantidade solicitada excede o saldo disponível entre os
                    blocos.
                  </DialogDescription>
                )}

                {/* DISTRIBUIÇÃO */}

                <div className="space-y-3">
                  <DialogTitle>Distribuição</DialogTitle>

                  <DialogDescription>
                    Distribuído: {distributed}
                    {" / "}
                    {quantity}
                  </DialogDescription>

                  {block.allocations.map((allocation, allocationIndex) => {
                    const quantityFromOthers = block.allocations.reduce(
                      (total, candidate) => {
                        if (candidate.id === allocation.id) {
                          return total;
                        }

                        return total + parseQuantity(candidate.quantity);
                      },
                      0,
                    );

                    const maxForAllocation = Math.max(
                      quantity - quantityFromOthers,
                      0,
                    );

                    const selectedByOthers = new Set(
                      block.allocations
                        .filter((candidate) => candidate.id !== allocation.id)
                        .map((candidate) => candidate.userId)
                        .filter(Boolean),
                    );

                    return (
                      <div
                        key={allocation.id}
                        className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
                      >
                        <div className="space-y-2">
                          <Label>Usuário comercial</Label>

                          <Select
                            items={commercialUserItems}
                            value={allocation.userId || null}
                            onValueChange={(value) =>
                              updateAllocation(
                                block.id,
                                allocation.id,
                                (current) => ({
                                  ...current,
                                  userId: value ?? "",
                                }),
                              )
                            }
                            disabled={isImporting}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o vendedor" />
                            </SelectTrigger>

                            <SelectContent>
                              {options.commercialUsers.map((user) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id}
                                  disabled={selectedByOthers.has(user.id)}
                                >
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Quantidade a distribuir</Label>

                          <Input
                            type="number"
                            min={1}
                            max={maxForAllocation}
                            value={allocation.quantity}
                            onChange={(event) => {
                              const raw = event.target.value;

                              const parsed = parseQuantity(raw);

                              const safeValue = Math.min(
                                parsed,
                                maxForAllocation,
                              );

                              updateAllocation(
                                block.id,
                                allocation.id,
                                (current) => ({
                                  ...current,
                                  quantity:
                                    raw === ""
                                      ? ""
                                      : safeValue > 0
                                        ? String(safeValue)
                                        : "",
                                }),
                              );
                            }}
                            disabled={quantity <= 0 || isImporting}
                          />
                        </div>

                        <div className="flex items-end">
                          {allocationIndex > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeAllocation(block.id, allocation.id)
                              }
                              disabled={isImporting}
                            >
                              <Trash2Icon />

                              <span className="sr-only">Remover vendedor</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {quantity > 0 && remaining > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAllocation(block.id)}
                      disabled={
                        options.commercialUsers.length <=
                          block.allocations.length || isImporting
                      }
                    >
                      <PlusIcon />
                      Adicionar vendedor
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <AspectRatio ratio={6 / 1}>
            <Button
              type="button"
              variant="outline"
              className="h-full w-full"
              onClick={addBlock}
              disabled={isImporting}
            >
              <PlusIcon />
              Adicionar outro bloco de importação
            </Button>
          </AspectRatio>

          {/* ENVIO DAS LISTAS */}

          <div className="space-y-3">
            <div>
              <DialogTitle>Envio da lista</DialogTitle>

              <DialogDescription>
                Escolha como a lista da distribuição deverá ser enviada após a
                importação.
              </DialogDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                htmlFor="goalfy-send-whatsapp"
                className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md border p-4"
              >
                <Checkbox
                  id="goalfy-send-whatsapp"
                  checked={sendListByWhatsApp}
                  onCheckedChange={setSendListByWhatsApp}
                  disabled={isImporting}
                />

                <span className="text-sm font-medium">
                  Enviar lista por WhatsApp
                </span>
              </label>

              <label
                htmlFor="goalfy-send-email"
                className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md border p-4"
              >
                <Checkbox
                  id="goalfy-send-email"
                  checked={sendListByEmail}
                  onCheckedChange={setSendListByEmail}
                  disabled={isImporting}
                />

                <span className="text-sm font-medium">
                  Enviar lista por E-mail
                </span>
              </label>
            </div>
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
            disabled={!formIsValid || isImporting || !onImport}
          >
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalfyBulkImportDialog;
