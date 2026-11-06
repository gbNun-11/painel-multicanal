import React from "react";

export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-w-0 space-y-6 p-4 sm:p-6">{children}</div>;
};

export const PageHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {children}
    </div>
  );
};

export const PageHeaderContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="min-w-0 space-y-1">{children}</div>;
};

export const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return <h1 className="text-2xl font-bold">{children}</h1>;
};

export const PageDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <p className="text-sm text-muted-foreground">{children}</p>;
};

export const PageActions = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0">
      {children}
    </div>
  );
};

export const PageContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-w-0 space-y-6">{children}</div>;
};
