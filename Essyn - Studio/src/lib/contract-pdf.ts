"use client";

/**
 * Contract PDF Generator — uses jsPDF (client-side)
 * Generates a formatted PDF from contract text content.
 */

import { jsPDF } from "jspdf";

export interface ContractPdfOptions {
  title: string;
  content: string;
  studioName: string;
  clientName?: string;
  value?: number | null;
  date?: string;
}

/** Replace template variables in content */
export function applyVariables(
  content: string,
  vars: Record<string, string>
): string {
  return content.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/** Generate a contract PDF and return as File */
export function generateContractPdf(opts: ContractPdfOptions): File {
  const { title, content, studioName, clientName, value, date } = opts;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(44, 68, 77); // Essyn teal #2C444D
  doc.rect(0, 0, pageW, 14, "F");

  doc.setTextColor(165, 141, 102); // Essyn gold #A58D66
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(studioName.toUpperCase(), margin, 9);

  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", pageW - margin, 9, { align: "right" });

  y = 26;

  // ── Title ────────────────────────────────────────────────────────────────────
  doc.setTextColor(12, 16, 14); // Essyn obsidian #0C100E
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 8;

  // ── Meta info row ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(122, 138, 143);

  const metaParts: string[] = [];
  if (clientName) metaParts.push(`Cliente: ${clientName}`);
  if (value) metaParts.push(`Valor: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}`);
  if (date) metaParts.push(`Data: ${date}`);

  if (metaParts.length > 0) {
    doc.text(metaParts.join("   ·   "), margin, y);
    y += 5;
  }

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(229, 225, 221); // border color
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Body content ─────────────────────────────────────────────────────────────
  doc.setTextColor(12, 16, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const lines = doc.splitTextToSize(content, contentW);
  const lineH = 5.5;

  for (const line of lines) {
    // Check if we need a new page
    if (y + lineH > pageH - 30) {
      doc.addPage();
      y = margin;

      // Repeat thin header on continuation pages
      doc.setFillColor(44, 68, 77);
      doc.rect(0, 0, pageW, 8, "F");
      doc.setTextColor(165, 141, 102);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(studioName.toUpperCase(), margin, 5.5);
      y = 18;

      doc.setTextColor(12, 16, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    // Bold for lines that look like section headers (ALL CAPS or ending with ":")
    const trimmed = (line as string).trim();
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes(",")) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 68, 77);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(12, 16, 14);
    }

    doc.text(line as string, margin, y);
    y += lineH;
  }

  // ── Signature area ───────────────────────────────────────────────────────────
  const sigY = Math.max(y + 20, pageH - 55);

  // Check if signature area fits on current page
  if (sigY + 40 > pageH) {
    doc.addPage();
    y = margin;

    doc.setFillColor(44, 68, 77);
    doc.rect(0, 0, pageW, 8, "F");
    doc.setTextColor(165, 141, 102);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(studioName.toUpperCase(), margin, 5.5);
  }

  const finalSigY = sigY > pageH - 55 ? margin + 20 : sigY;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  // Studio signature
  doc.line(margin, finalSigY + 14, margin + 70, finalSigY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(122, 138, 143);
  doc.text(studioName, margin, finalSigY + 19);
  doc.text("Contratado(a)", margin, finalSigY + 23);

  // Client signature
  if (clientName) {
    doc.line(pageW - margin - 70, finalSigY + 14, pageW - margin, finalSigY + 14);
    doc.text(clientName, pageW - margin - 70, finalSigY + 19);
    doc.text("Contratante", pageW - margin - 70, finalSigY + 23);
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(247, 245, 242);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(181, 175, 166);
    doc.text(
      `Gerado por ${studioName} via Essyn Studio · Página ${i} de ${totalPages}`,
      pageW / 2,
      pageH - 4,
      { align: "center" }
    );
  }

  const blob = doc.output("blob");
  return new File([blob], "contrato.pdf", { type: "application/pdf" });
}
