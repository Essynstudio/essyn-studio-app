import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!studio) return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });

  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");

  if (tipo === "clientes") {
    const { data } = await supabase
      .from("clients")
      .select("name, email, phone, document, city, state, status, total_spent, created_at")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name");

    const csv = generateCSV(data || [], ["name", "email", "phone", "document", "city", "state", "status", "total_spent", "created_at"], ["Nome", "Email", "Telefone", "Documento", "Cidade", "Estado", "Status", "Total Gasto", "Criado em"]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="clientes-${new Date().toISOString().split("T")[0]}.csv"` },
    });
  }

  if (tipo === "financeiro") {
    const { data } = await supabase
      .from("installments")
      .select("description, type, amount, paid_amount, due_date, paid_at, status, payment_method, category")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("due_date", { ascending: false });

    const csv = generateCSV(data || [], ["description", "type", "amount", "paid_amount", "due_date", "paid_at", "status", "payment_method", "category"], ["Descricao", "Tipo", "Valor", "Valor Pago", "Vencimento", "Pago em", "Status", "Metodo", "Categoria"]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="financeiro-${new Date().toISOString().split("T")[0]}.csv"` },
    });
  }

  if (tipo === "projetos") {
    const { data } = await supabase
      .from("projects")
      .select("name, event_type, event_date, status, production_phase, value, paid, created_at")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const csv = generateCSV(data || [], ["name", "event_type", "event_date", "status", "production_phase", "value", "paid", "created_at"], ["Nome", "Tipo Evento", "Data Evento", "Status", "Fase Produção", "Valor", "Pago", "Criado em"]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="projetos-${new Date().toISOString().split("T")[0]}.csv"` },
    });
  }

  if (tipo === "leads") {
    const { data } = await supabase
      .from("leads")
      .select("name, email, phone, stage, event_type, estimated_value, source, created_at")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const csv = generateCSV(data || [], ["name", "email", "phone", "stage", "event_type", "estimated_value", "source", "created_at"], ["Nome", "Email", "Telefone", "Estagio", "Tipo Evento", "Valor Estimado", "Origem", "Criado em"]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"` },
    });
  }

  return NextResponse.json({ error: "Tipo invalido. Use: clientes, financeiro, projetos, leads" }, { status: 400 });
}

function generateCSV(data: Record<string, unknown>[], keys: string[], headers: string[]): string {
  const BOM = "\uFEFF";
  const headerRow = headers.join(";");
  const rows = data.map(row =>
    keys.map(key => {
      const val = row[key];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(";")
  );
  return BOM + headerRow + "\n" + rows.join("\n");
}
