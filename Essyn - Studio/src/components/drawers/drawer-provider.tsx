"use client";

import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from "react";
import { ProjectDrawer } from "./project-drawer";
import type { DrawerData } from "./project-drawer";
import { ClientDrawer } from "./client-drawer";

export type DrawerTab = "dados" | "galeria" | "financeiro" | "producao" | "pedidos" | "briefing" | "servicos" | "timeline";

type EditProjectHandler = (data: DrawerData, targetStep?: number) => void;

interface DrawerContextType {
  openDrawer: (projectId: string, tab?: DrawerTab) => void;
  closeDrawer: () => void;
  registerEditHandler: (handler: EditProjectHandler) => void;
}

interface ClientDrawerContextType {
  openClientDrawer: (clientId: string) => void;
  closeClientDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | null>(null);
const ClientDrawerContext = createContext<ClientDrawerContextType | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("dados");
  const [clientDrawerId, setClientDrawerId] = useState<string | null>(null);
  const editHandlerRef = useRef<EditProjectHandler | null>(null);

  const openDrawer = (id: string, tab: DrawerTab = "dados") => {
    setProjectId(id);
    setActiveTab(tab);
  };

  const closeDrawer = () => {
    setProjectId(null);
  };

  const openClientDrawer = (clientId: string) => {
    setClientDrawerId(clientId);
  };

  const closeClientDrawer = () => {
    setClientDrawerId(null);
  };

  const registerEditHandler = useCallback((handler: EditProjectHandler) => {
    editHandlerRef.current = handler;
  }, []);

  const handleEditProject = useCallback((data: DrawerData, targetStep?: number) => {
    if (editHandlerRef.current) {
      setProjectId(null); // Close drawer before opening wizard
      editHandlerRef.current(data, targetStep);
    }
  }, []);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, registerEditHandler }}>
      <ClientDrawerContext.Provider value={{ openClientDrawer, closeClientDrawer }}>
        {children}
        <ProjectDrawer
          projectId={projectId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={closeDrawer}
          onEditProject={handleEditProject}
        />
        <ClientDrawer
          clientId={clientDrawerId}
          onClose={closeClientDrawer}
        />
      </ClientDrawerContext.Provider>
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}

export function useClientDrawer() {
  const ctx = useContext(ClientDrawerContext);
  if (!ctx) throw new Error("useClientDrawer must be used within DrawerProvider");
  return ctx;
}
