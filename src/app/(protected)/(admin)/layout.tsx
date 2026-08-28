import React from "react";

const ProtectLayout = ({ children }: { children: React.ReactNode }) => {
  return <main className="w-full">{children}</main>;
};

export default ProtectLayout;
