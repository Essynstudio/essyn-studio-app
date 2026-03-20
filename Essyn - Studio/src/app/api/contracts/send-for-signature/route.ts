import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAutentiqueDocument } from "@/lib/autentique";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contract_id } = await req.json() as { contract_id: string };
  if (!contract_id) {
    return NextResponse.json({ error: "contract_id required" }, { status: 400 });
  }

  // 1. Fetch contract + client info
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      id, title, file_url, status, studio_id,
      clients (id, name, email)
    `)
    .eq("id", contract_id)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Verify ownership
  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("id", contract.studio_id)
    .eq("owner_id", user.id)
    .single();

  if (!studio) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!contract.file_url) {
    return NextResponse.json({ error: "Contract has no PDF attached" }, { status: 400 });
  }

  const client = contract.clients as unknown as { id: string; name: string; email: string } | null;
  if (!client?.email) {
    return NextResponse.json({ error: "Client has no email" }, { status: 400 });
  }

  // 2. Download the PDF from Supabase Storage and convert to base64
  let pdfBase64: string;
  try {
    const pdfRes = await fetch(contract.file_url);
    if (!pdfRes.ok) throw new Error("Failed to fetch PDF");
    const arrayBuffer = await pdfRes.arrayBuffer();
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    pdfBase64 = btoa(binary);
  } catch (e) {
    return NextResponse.json({ error: "Failed to download PDF: " + String(e) }, { status: 500 });
  }

  // 3. Send to Autentique
  let docId: string;
  let signingUrl: string;
  try {
    const result = await createAutentiqueDocument({
      name: contract.title,
      pdfBase64,
      signers: [{ name: client.name, email: client.email }],
      message: `Olá ${client.name}, segue o contrato para assinatura eletrônica.`,
    });
    docId = result.documentId;
    signingUrl = result.signingUrl;
  } catch (e) {
    return NextResponse.json({ error: "Autentique error: " + String(e) }, { status: 500 });
  }

  // 4. Update contract in DB
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      status: "enviado",
      sent_at: now,
      autentique_document_id: docId,
      autentique_signing_url: signingUrl,
    })
    .eq("id", contract_id);

  if (updateError) {
    return NextResponse.json({ error: "DB update failed: " + updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, documentId: docId, signingUrl });
}
