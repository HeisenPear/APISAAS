// Helpers safe pour les dates dans les templates SQL Drizzle
// JAMAIS passer new Date() directement dans sql`` — postgres.js ne sérialise pas correctement

export function sqlDate(date: Date | string): string {
  if (date instanceof Date) return date.toISOString();
  return date;
}

export function sqlDateRange(start: Date | string, end: Date | string) {
  return {
    start: sqlDate(start),
    end: sqlDate(end),
  };
}
