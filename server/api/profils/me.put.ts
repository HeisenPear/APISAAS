import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const updateProfilSchema = z.object({
  /**
   * ⚠️ L'ORDRE DES CHECKS ZOD N'EST PAS COSMÉTIQUE. Ils s'appliquent DANS
   * L'ORDRE DÉCLARÉ : `z.string().min(1).trim()` mesure la longueur AVANT de
   * rogner, si bien que `'   '` passait la validation et s'écrivait en base
   * comme chaîne VIDE. Trois gestes suffisaient : Réglages › Nom › une espace ›
   * Entrée.
   *
   * C'était déjà faux ; c'est devenu grave depuis que `refusIdentiteEmetteur`
   * bloque l'émission d'une facture sans nom. L'apiculteur se retrouvait sans
   * facture possible, avec un refus qui le renvoyait « dans Réglages › Mon
   * profil » — l'écran exact où il venait de vider son nom, sans que rien ne
   * l'ait averti.
   */
  nom: z.string().trim().min(1, 'Le nom est requis').optional(),
  prenom: z.string().trim().min(1, 'Le prenom est requis').optional(),
  /**
   * Nom commercial — facultatif, et EFFAÇABLE : `nullable()` autorise le vider,
   * sans quoi un apiculteur qui change d'avis resterait coincé avec.
   *
   * La borne à 80 caractères est celle de l'en-tête de facture : au-delà, le
   * nom déborde de son bloc (55 % de la largeur du document) ou écrase le titre
   * « FACTURE » en face. Refuser tôt vaut mieux qu'un document abîmé.
   */
  nomCommercial: z
    .string()
    .trim()
    .max(80, 'Le nom commercial ne peut pas dépasser 80 caractères')
    .optional()
    .nullable(),
  telephone: z.string().trim().optional().nullable(),
  adresse: z.string().trim().optional().nullable(),
  codePostal: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .optional()
    .nullable(),
  ville: z.string().trim().optional().nullable(),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres')
    .optional()
    .nullable(),
  napi: z.string().trim().optional().nullable(),
  optionTvaDebits: z.boolean().optional(),
  franchiseTva: z.boolean().optional(),
  preferences: z
    .record(z.unknown())
    .optional()
    .nullable()
    .refine(
      (v) => !v || JSON.stringify(v).length < 10000,
      'Préférences trop volumineuses (max 10 Ko)',
    ),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, updateProfilSchema.parse);

  /**
   * ⚠️ `preferences` SE FUSIONNE, IL NE SE REMPLACE PAS — ET LE REMPLACEMENT
   * PERDAIT DES DONNÉES RÉELLES.
   *
   * Ce `.set({ ...body })` écrasait le blob jsonb entier avec celui que le
   * navigateur avait envoyé. Or ce blob-là vient d'un instantané restauré
   * SYNCHRONEMENT depuis `localStorage` à la création du magasin
   * (`app/stores/auth.ts`), et il n'est presque jamais rafraîchi : le plugin de
   * persistance ne relit le profil que `si (session && !profil)` — or il n'est
   * justement pas nul, puisqu'il vient d'être restauré. Dans un onglet ouvert
   * depuis plusieurs jours, l'instantané a plusieurs jours.
   *
   * Pendant ce temps, le SERVEUR écrit dans le même blob sans que le client le
   * sache : abonnements push (`webPush.ts`), solde de départ de trésorerie,
   * marqueur d'e-mail de bienvenue, marqueurs de campagnes déjà envoyées.
   * Fermer une bannière d'accueil dans le vieil onglet rembobinait donc TOUT :
   * l'écran de trésorerie redemandait un solde déjà saisi, et un e-mail de
   * bienvenue repartait une seconde fois.
   *
   * `webPush.ts` connaît le piège et l'évite déjà côté serveur, par un
   * `jsonb_set` chirurgical (« ce qui clobbait un abonnement ou une préférence
   * écrits en parallèle »). C'est le chemin CLIENT qui restait ouvert.
   *
   * Les sept appelants du navigateur écrivent tous `{ ...existant, nouvelleClé }`
   * : la fusion est ce qu'ils veulent tous déjà dire. Seul `null` — jamais
   * envoyé aujourd'hui — garde le sens de « efface tout », parce qu'il faut
   * bien qu'un geste explicite reste possible.
   */
  const fusionner = body.preferences != null;
  const [ancien] = fusionner
    ? await db
        .select({ preferences: profils.preferences })
        .from(profils)
        .where(eq(profils.id, user.id))
        .limit(1)
    : [];

  const [updatedProfil] = await db
    .update(profils)
    .set({
      ...body,
      ...(fusionner
        ? { preferences: { ...(ancien?.preferences ?? {}), ...body.preferences } }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(profils.id, user.id))
    .returning();

  if (!updatedProfil) {
    notFound('Profil introuvable');
  }

  return { data: updatedProfil };
});
