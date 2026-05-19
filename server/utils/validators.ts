import { z } from 'zod';

/**
 * Schema de pagination pour les listes avec recherche optionnelle.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().trim().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Schema de validation UUID v4.
 */
export const uuidSchema = z.string().uuid('UUID invalide');

export type UuidInput = z.infer<typeof uuidSchema>;

/**
 * Schema pour un filtre de plage de dates (from/to).
 */
export const dateRangeSchema = z
  .object({
    from: z.coerce.date({ message: 'Date de debut invalide' }),
    to: z.coerce.date({ message: 'Date de fin invalide' }),
  })
  .refine((data) => data.from <= data.to, {
    message: 'La date de debut doit etre anterieure ou egale a la date de fin',
    path: ['from'],
  });

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
