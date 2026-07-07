import { z } from 'zod';

// ─── Prévisions de trésorerie (postes planifiés) ─────────────

export const previsionSchema = z.object({
  libelle: z.string().min(1, 'Libellé requis').max(120).trim(),
  /** Montant toujours positif ; le sens (entrée/sortie) vient de `type`. */
  montant: z.number().positive('Montant positif requis').max(100_000_000),
  type: z.enum(['depense', 'investissement', 'recette']).default('depense'),
  recurrence: z.enum(['ponctuel', 'mensuel', 'annuel']).default('ponctuel'),
  datePrevue: z.coerce.date(),
  notes: z.string().max(500).trim().optional().nullable(),
});
