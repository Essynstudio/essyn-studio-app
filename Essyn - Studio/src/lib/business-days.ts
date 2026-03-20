/**
 * Utility functions for business day calculations (weekends only, no holidays).
 */

/**
 * Adds N business days to a date, skipping weekends (Saturday=6, Sunday=0).
 * Returns a new Date without mutating the original.
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }

  return result;
}

/**
 * Takes an ISO date string and a number of business days, returns the deadline
 * formatted as "dd/MM/yyyy" in pt-BR locale, or null if inputs are invalid.
 */
export function formatBusinessDeadline(
  eventDate: string,
  businessDays: number
): string | null {
  if (!eventDate || !Number.isFinite(businessDays) || businessDays < 0) {
    return null;
  }

  const parsed = new Date(eventDate);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  const deadline = addBusinessDays(parsed, businessDays);

  return deadline.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
