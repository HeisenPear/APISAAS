/** Destination proposée dans la modale de déplacement (emplacement ou rucher). */
export interface DestinationDeplacement {
  id: string;
  nom: string;
  sousTitre?: string | null;
  /** Occupation actuelle → jauge de remplissage (ruches présentes / capacité). */
  occupe?: number;
  capacite?: number | null;
  /** Destination = position actuelle : affichée mais non sélectionnable. */
  estActuelle?: boolean;
}

/** Charge utile émise à la confirmation d'un déplacement. */
export interface ConfirmationDeplacement {
  destinationId: string;
  date: string;
  notes: string;
  motif: string;
}
