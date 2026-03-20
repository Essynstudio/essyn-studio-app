"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { GalleryStatus, EventType, InviteRole, PortalBranding } from "@/lib/types";

export interface PortalContextData {
  token: string;
  role: InviteRole;

  gallery: {
    id: string;
    name: string;
    status: GalleryStatus;
    photoCount: number;
    downloadEnabled: boolean;
  };

  project: {
    id: string;
    name: string;
    eventType: EventType;
    eventDate: string | null;
  } | null;

  studio: {
    id: string;
    name: string;
  };

  client: {
    id: string;
    name: string;
    email: string | null;
  } | null;

  branding: PortalBranding;
}

const PortalContext = createContext<PortalContextData | null>(null);

export function PortalProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PortalContextData;
}) {
  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}
