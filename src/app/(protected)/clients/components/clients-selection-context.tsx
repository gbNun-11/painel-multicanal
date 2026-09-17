"use client";

import type { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

interface ClientsSelectionContextValue {
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;

  selectedClientIds: string[];

  hasSelection: boolean;

  clearSelection: () => void;
}

const ClientsSelectionContext =
  createContext<ClientsSelectionContextValue | null>(null);

interface ClientsSelectionProviderProps {
  children: ReactNode;
}

export const ClientsSelectionProvider = ({
  children,
}: ClientsSelectionProviderProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedClientIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id),
    [rowSelection],
  );

  const value = useMemo<ClientsSelectionContextValue>(
    () => ({
      rowSelection,
      setRowSelection,

      selectedClientIds,

      hasSelection: selectedClientIds.length > 0,

      clearSelection: () => {
        setRowSelection({});
      },
    }),
    [rowSelection, selectedClientIds],
  );

  return (
    <ClientsSelectionContext.Provider value={value}>
      {children}
    </ClientsSelectionContext.Provider>
  );
};

export const useClientsSelection = () => {
  const context = useContext(ClientsSelectionContext);

  if (!context) {
    throw new Error(
      "useClientsSelection deve ser usado dentro de ClientsSelectionProvider.",
    );
  }

  return context;
};
