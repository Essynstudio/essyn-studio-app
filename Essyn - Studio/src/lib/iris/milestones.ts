export interface Milestone {
  id: string;
  message: string;
  subtext: string;
  type: "revenue" | "projects" | "galleries" | "clients" | "streak";
}

interface MilestoneContext {
  totalProjects: number;
  totalClients: number;
  totalGalleries: number;
  totalReceived: number; // total revenue received
  activeProjects: number;
}

// Check which milestones were just reached
export function checkMilestones(ctx: MilestoneContext, previousMilestones: string[]): Milestone[] {
  const reached: Milestone[] = [];

  // Revenue milestones
  const revenueTiers = [
    { threshold: 5000, id: "rev_5k", msg: "R$ 5.000 em receitas recebidas!" },
    { threshold: 10000, id: "rev_10k", msg: "R$ 10.000 em receitas!" },
    { threshold: 25000, id: "rev_25k", msg: "R$ 25.000 em receitas!" },
    { threshold: 50000, id: "rev_50k", msg: "R$ 50.000 em receitas!" },
    { threshold: 100000, id: "rev_100k", msg: "R$ 100.000 em receitas!" },
  ];

  for (const tier of revenueTiers) {
    if (ctx.totalReceived >= tier.threshold && !previousMilestones.includes(tier.id)) {
      reached.push({
        id: tier.id,
        message: tier.msg,
        subtext: `Seu estúdio já faturou ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(ctx.totalReceived)}. Continue crescendo.`,
        type: "revenue",
      });
    }
  }

  // Project milestones
  const projectTiers = [
    { threshold: 1, id: "proj_1", msg: "Primeiro projeto criado!" },
    { threshold: 10, id: "proj_10", msg: "10 projetos no Essyn!" },
    { threshold: 25, id: "proj_25", msg: "25 projetos!" },
    { threshold: 50, id: "proj_50", msg: "50 projetos!" },
    { threshold: 100, id: "proj_100", msg: "100 projetos!" },
  ];

  for (const tier of projectTiers) {
    if (ctx.totalProjects >= tier.threshold && !previousMilestones.includes(tier.id)) {
      reached.push({
        id: tier.id,
        message: tier.msg,
        subtext: `${ctx.totalProjects} projetos gerenciados no Essyn. Cada um conta.`,
        type: "projects",
      });
    }
  }

  // Client milestones
  const clientTiers = [
    { threshold: 5, id: "cli_5", msg: "5 clientes cadastrados!" },
    { threshold: 20, id: "cli_20", msg: "20 clientes!" },
    { threshold: 50, id: "cli_50", msg: "50 clientes!" },
    { threshold: 100, id: "cli_100", msg: "100 clientes!" },
  ];

  for (const tier of clientTiers) {
    if (ctx.totalClients >= tier.threshold && !previousMilestones.includes(tier.id)) {
      reached.push({
        id: tier.id,
        message: tier.msg,
        subtext: `Sua base de clientes está crescendo. Isso é sinal de um estúdio saudável.`,
        type: "clients",
      });
    }
  }

  // Gallery milestones
  const galleryTiers = [
    { threshold: 5, id: "gal_5", msg: "5 galerias criadas!" },
    { threshold: 25, id: "gal_25", msg: "25 galerias!" },
    { threshold: 100, id: "gal_100", msg: "100 galerias!" },
  ];

  for (const tier of galleryTiers) {
    if (ctx.totalGalleries >= tier.threshold && !previousMilestones.includes(tier.id)) {
      reached.push({
        id: tier.id,
        message: tier.msg,
        subtext: `${ctx.totalGalleries} galerias entregues. Seu portfólio fala por si.`,
        type: "galleries",
      });
    }
  }

  return reached;
}
