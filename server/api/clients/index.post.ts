import { z } from 'zod';
import { clients } from '~~/server/database/schema';

const createClientSchema = z.object({
  type: z.enum(['particulier', 'professionnel', 'revendeur']).optional(),
  nom: z.string().trim().min(1, 'Nom requis').max(200),
  prenom: z.string().trim().max(200).optional(),
  entreprise: z.string().trim().max(300).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().trim().max(20).optional(),
  adresse: z.string().trim().max(500).optional(),
  codePostal: z.string().trim().max(10).optional(),
  ville: z.string().trim().max(200).optional(),
  siret: z.string().trim().max(20).optional(),
  siren: z
    .string()
    .length(9)
    .regex(/^\d{9}$/, 'Le SIREN doit contenir exactement 9 chiffres')
    .optional(),
  adresseLivraison: z.string().trim().max(500).optional(),
  codePostalLivraison: z.string().trim().max(10).optional(),
  villeLivraison: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, createClientSchema.parse);

  const [client] = await db
    .insert(clients)
    .values({
      userId: user.id,
      type: body.type ?? null,
      nom: body.nom,
      prenom: body.prenom ?? null,
      entreprise: body.entreprise ?? null,
      email: body.email || null,
      telephone: body.telephone ?? null,
      adresse: body.adresse ?? null,
      codePostal: body.codePostal ?? null,
      ville: body.ville ?? null,
      siret: body.siret ?? null,
      siren: body.siren ?? null,
      adresseLivraison: body.adresseLivraison ?? null,
      codePostalLivraison: body.codePostalLivraison ?? null,
      villeLivraison: body.villeLivraison ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: client };
});
