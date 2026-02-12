/**
 * Extract a human-readable message from a $fetch error.
 * Nitro/H3 errors put the real message in `error.data.message`,
 * while generic JS errors use `error.message`.
 */
export function getApiErrorMessage(e: unknown, fallback = 'Une erreur est survenue'): string {
  if (e && typeof e === 'object') {
    // $fetch FetchError from Nitro — message is in data.message
    const data = (e as Record<string, unknown>).data;
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as Record<string, unknown>).message === 'string'
    ) {
      return (data as Record<string, unknown>).message as string;
    }
    // Standard Error
    if ('message' in e && typeof (e as Record<string, unknown>).message === 'string') {
      const msg = (e as Record<string, unknown>).message as string;
      // Skip generic HTTP status messages
      if (msg && !msg.match(/^\d{3}\s/)) return msg;
    }
  }
  return fallback;
}
