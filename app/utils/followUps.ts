import type { DataEvent } from '~/composables/useDataBus';

export interface FollowUp {
  label: string;
  to: string;
  icon?: string;
}

interface FollowUpContext {
  id?: string;
  rucheId?: string;
  rucherId?: string;
  clientId?: string;
  recolteId?: string;
}

// Retourne les follow-ups pertinents selon le contexte de l'événement
export function getFollowUps(event: DataEvent, context: FollowUpContext): FollowUp[] {
  switch (event) {
    case 'intervention:created':
      return [
        context.rucheId
          ? { label: 'Voir la ruche', to: `/ruches/${context.rucheId}`, icon: 'i-lucide-eye' }
          : null,
      ].filter(Boolean) as FollowUp[];

    case 'recolte:created':
      return [
        {
          label: 'Compléter la quantité',
          to: `/production/recoltes/${context.recolteId}`,
          icon: 'i-lucide-edit',
        },
      ];

    case 'client:created':
      return [
        {
          label: 'Créer une vente',
          to: `/finances/ventes?clientId=${context.clientId}&action=create`,
          icon: 'i-lucide-receipt',
        },
      ];

    case 'vente:created':
      return [
        {
          label: 'Voir la facture',
          to: `/finances/facture/${context.id}`,
          icon: 'i-lucide-file-text',
        },
      ];

    case 'ruche:created':
      return [
        {
          label: 'Nouvelle intervention',
          to: `/interventions/nouvelle?rucheId=${context.id}`,
          icon: 'i-lucide-plus',
        },
      ];

    default:
      return [];
  }
}
