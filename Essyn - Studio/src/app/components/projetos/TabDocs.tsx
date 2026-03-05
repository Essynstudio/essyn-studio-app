import { StickyNote, FileText } from "lucide-react";
import { toast } from "sonner";
import { TabStateWrapper, TabEmpty, type TabState } from "./drawer-primitives";

export function TabDocs({ tabState }: { tabState: TabState }) {
  return (
    <TabStateWrapper state={tabState}>
      <TabEmpty
        icon={<StickyNote className="w-6 h-6 text-[#E5E5EA]" />}
        title="Nenhuma nota"
        description="Adicione anotações, briefings, referências visuais ou contratos relacionados ao projeto."
        ctaLabel="Nova nota"
        ctaIcon={<FileText className="w-3.5 h-3.5" />}
        onCta={() => toast.info("Nova nota", { description: "Funcionalidade em breve" })}
      />
    </TabStateWrapper>
  );
}
