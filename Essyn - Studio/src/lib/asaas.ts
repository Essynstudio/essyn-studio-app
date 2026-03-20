// ═══════════════════════════════════════════════════════════════
// Asaas API Wrapper — PIX, Boleto, Cartão
// Compatible with Cloudflare Workers (fetch-based)
// Docs: https://docs.asaas.com
// ═══════════════════════════════════════════════════════════════

const SANDBOX_URL = "https://sandbox.asaas.com/api/v3";
const PRODUCTION_URL = "https://api.asaas.com/api/v3";

export interface AsaasConfig {
  apiKey: string;
  sandbox: boolean;
}

function baseUrl(config: AsaasConfig) {
  return config.sandbox ? SANDBOX_URL : PRODUCTION_URL;
}

async function asaasFetch<T>(
  config: AsaasConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${baseUrl(config)}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: config.apiKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let message = `Asaas API error ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.errors?.[0]?.description) {
        message = parsed.errors[0].description;
      }
    } catch {
      message += `: ${body.slice(0, 200)}`;
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────

export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  status: string;
  billingType: AsaasBillingType;
  dueDate: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  description?: string;
  externalReference?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // base64 PNG
  payload: string;      // copia-e-cola
  expirationDate: string;
}

export interface AsaasBalance {
  balance: number;
}

// ── Customer ─────────────────────────────────────────────────

export async function createCustomer(
  config: AsaasConfig,
  data: {
    name: string;
    email?: string | null;
    cpfCnpj?: string | null;
    phone?: string | null;
    externalReference?: string;
  }
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(config, "/customers", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      email: data.email || undefined,
      cpfCnpj: data.cpfCnpj?.replace(/\D/g, "") || undefined,
      phone: data.phone?.replace(/\D/g, "") || undefined,
      externalReference: data.externalReference,
    }),
  });
}

export async function findCustomerByReference(
  config: AsaasConfig,
  externalReference: string
): Promise<AsaasCustomer | null> {
  const res = await asaasFetch<{ data: AsaasCustomer[] }>(
    config,
    `/customers?externalReference=${encodeURIComponent(externalReference)}`
  );
  return res.data[0] || null;
}

// ── Payment ──────────────────────────────────────────────────

export async function createPayment(
  config: AsaasConfig,
  data: {
    customer: string;         // Asaas customer ID
    billingType: AsaasBillingType;
    value: number;
    dueDate: string;          // YYYY-MM-DD
    description?: string;
    externalReference?: string;
    installmentCount?: number;
    installmentValue?: number;
  }
): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(config, "/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPayment(
  config: AsaasConfig,
  paymentId: string
): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(config, `/payments/${paymentId}`);
}

// ── PIX QR Code ──────────────────────────────────────────────

export async function getPixQrCode(
  config: AsaasConfig,
  paymentId: string
): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(config, `/payments/${paymentId}/pixQrCode`);
}

// ── Balance (for testing connection) ─────────────────────────

export async function getBalance(config: AsaasConfig): Promise<AsaasBalance> {
  return asaasFetch<AsaasBalance>(config, "/finance/balance");
}

// ── Payment method mapping ───────────────────────────────────

export function mapPaymentMethod(method: string | null): AsaasBillingType {
  switch (method) {
    case "pix":
      return "PIX";
    case "boleto":
      return "BOLETO";
    case "cartao_credito":
      return "CREDIT_CARD";
    default:
      return "UNDEFINED"; // Asaas lets customer choose
  }
}
