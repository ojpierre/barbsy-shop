// Currency support for Barbsy
// Prices are stored in USD in the database
// Displayed in KES for Kenyan users, USD for others

export type CurrencyCode = "KES" | "USD"

export const CURRENCIES = {
  KES: { code: "KES" as const, symbol: "KSh", rate: 150, locale: "en-KE" },
  USD: { code: "USD" as const, symbol: "$", rate: 1, locale: "en-US" },
} as const

/**
 * Detect currency based on browser timezone
 * Africa/Nairobi → KES, everywhere else → USD
 */
export function detectCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "KES" // Default to KES (primary market)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Kenya and East Africa timezones → KES
    if (tz === "Africa/Nairobi") return "KES"
  } catch {
    // Fallback
  }
  return "USD"
}

/**
 * Convert USD amount to target currency
 */
export function convertPrice(amountUSD: number, currency: CurrencyCode): number {
  return amountUSD * CURRENCIES[currency].rate
}

/**
 * Format a USD price for display in the given currency
 */
export function formatPrice(amountUSD: number, currency: CurrencyCode): string {
  const converted = convertPrice(amountUSD, currency)
  if (currency === "KES") {
    return `KSh ${Math.round(converted).toLocaleString()}`
  }
  return `$${converted.toFixed(2)}`
}

/**
 * Convert USD to KES (for PayHero / M-Pesa)
 */
export function toKES(amountUSD: number): number {
  return Math.round(amountUSD * CURRENCIES.KES.rate)
}

/**
 * Shipping cost in USD (source of truth)
 * Free shipping over $50 USD
 */
export function shippingCostUSD(subtotalUSD: number): number {
  return subtotalUSD >= 50 ? 0 : 5
}

/**
 * Format shipping display
 */
export function formatShipping(subtotalUSD: number, currency: CurrencyCode): string {
  const cost = shippingCostUSD(subtotalUSD)
  if (cost === 0) return "Free"
  return formatPrice(cost, currency)
}
