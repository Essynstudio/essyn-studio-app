"use client";

import { createContext, useContext } from "react";
import type { PortalSessionData } from "./layout";

const PortalSessionContext = createContext<PortalSessionData | null>(null);

export function PortalSessionProvider({
  data,
  children,
}: {
  data: PortalSessionData;
  children: React.ReactNode;
}) {
  return (
    <PortalSessionContext.Provider value={data}>
      {children}
    </PortalSessionContext.Provider>
  );
}

export function usePortalSession(): PortalSessionData | null {
  return useContext(PortalSessionContext);
}
