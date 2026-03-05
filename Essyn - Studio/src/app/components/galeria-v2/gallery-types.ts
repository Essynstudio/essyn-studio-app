/**
 * Local types for galeria-v2 — independent of the canonical
 * GalleryStatusBadge design-system types (which use a different lifecycle).
 * These reflect the full V2 status model used in mock data and V2 components.
 */

export type V2GalleryStatus = "draft" | "proofing" | "final" | "delivered";
export type V2GalleryPrivacy = "publico" | "privado" | "senha" | "expira";
