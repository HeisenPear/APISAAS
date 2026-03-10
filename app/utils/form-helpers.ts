// Vérifie qu'une valeur est un nombre fini (pas NaN, pas Infinity, pas "")
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Nettoie un champ numérique avant envoi API
// Retourne le nombre ou undefined (pour que Zod le gère côté serveur)
export function cleanNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
