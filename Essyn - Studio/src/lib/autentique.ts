/**
 * Autentique GraphQL API client
 * https://docs.autentique.com.br/api
 */

const AUTENTIQUE_API = "https://api.autentique.com.br/v2/graphql";

function getApiKey(): string {
  const key = process.env.AUTENTIQUE_API_KEY;
  if (!key) throw new Error("AUTENTIQUE_API_KEY not configured");
  return key;
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(AUTENTIQUE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Autentique HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json() as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return json.data as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AutentiqueDocument {
  id: string;
  name: string;
  status: {
    name: string; // "PENDING" | "SIGNED" | "REJECTED" | "CANCELLED"
  };
  signers: AutentiqueSigner[];
  created_at: string;
}

export interface AutentiqueSigner {
  public_id: string;
  name: string;
  email: string;
  action: { name: string };
  link: { short_link: string };
  signed: { created_at: string | null };
  rejected: { created_at: string | null };
}

// ─── Create document from base64 PDF ─────────────────────────────────────────

export async function createAutentiqueDocument(params: {
  name: string;
  pdfBase64: string;
  signers: { name: string; email: string }[];
  message?: string;
}): Promise<{ documentId: string; signingUrl: string }> {
  // Autentique v2: pass PDF as base64 in document.content_base64
  const createQuery = `
    mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!) {
      createDocument(document: $document, signers: $signers) {
        id
        signers {
          public_id
          link { short_link }
        }
      }
    }
  `;

  const data = await gql<{
    createDocument: {
      id: string;
      signers: { public_id: string; link: { short_link: string } }[];
    };
  }>(createQuery, {
    document: {
      name: params.name,
      message: params.message || "Por favor, assine o contrato.",
      content_base64: params.pdfBase64,
    },
    signers: params.signers.map((s) => ({
      email: s.email,
      name: s.name,
      action: "SIGN",
      positions: [],
    })),
  });

  const doc = data.createDocument;
  const signerLink = doc.signers[0]?.link?.short_link || "";

  return {
    documentId: doc.id,
    signingUrl: signerLink,
  };
}

// ─── Get document status ──────────────────────────────────────────────────────

export async function getAutentiqueDocument(documentId: string): Promise<AutentiqueDocument> {
  const query = `
    query GetDocument($id: UUID!) {
      document(id: $id) {
        id
        name
        status { name }
        created_at
        signers {
          public_id
          name
          email
          action { name }
          link { short_link }
          signed { created_at }
          rejected { created_at }
        }
      }
    }
  `;

  const data = await gql<{ document: AutentiqueDocument }>(query, { id: documentId });
  return data.document;
}

// ─── Delete document ──────────────────────────────────────────────────────────

export async function deleteAutentiqueDocument(documentId: string): Promise<boolean> {
  const query = `
    mutation DeleteDocument($id: UUID!) {
      deleteDocument(id: $id)
    }
  `;

  const data = await gql<{ deleteDocument: boolean }>(query, { id: documentId });
  return data.deleteDocument;
}
