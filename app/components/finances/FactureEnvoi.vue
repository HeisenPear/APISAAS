<template>
  <!-- Refus : c'est l'événement le PLUS RÉCENT, parce qu'un envoi réussi
       efface la trace d'échec côté serveur. -->
  <div
    v-if="dernierEchec"
    class="rounded-[12px] border border-[var(--clay)] bg-[var(--clay-soft)] px-4 py-3"
  >
    <div class="flex items-start gap-2.5">
      <UIcon
        name="i-lucide-mail-x"
        class="mt-0.5 h-4 w-4 shrink-0 text-[var(--clay-deep)]"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p class="text-[13px] font-semibold text-[var(--clay-deep)]">
          Le dernier envoi par email n’est pas parti
        </p>
        <p class="mt-1 text-[12px] leading-snug text-[var(--text-secondary)]">
          {{ dernierEchec }}
        </p>
      </div>
    </div>
  </div>

  <!-- Envoi confirmé : la date, l'adresse, et l'identifiant du message. -->
  <div
    v-else-if="envoyeLe"
    class="rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-3"
  >
    <div class="flex items-start gap-2.5">
      <UIcon
        name="i-lucide-mail-check"
        class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p class="text-[13px] font-semibold text-[var(--text-primary)]">
          Envoyée{{ clientEmail ? ` à ${clientEmail}` : '' }} le {{ quand }}
        </p>
        <p class="mt-1 text-[12px] leading-snug text-[var(--text-secondary)]">
          Le service d’envoi a accepté le message.
          <template v-if="messageId">
            Référence
            <span class="font-mono text-[11px] text-[var(--text-tertiary)]">{{ messageId }}</span
            >, à donner si vous nous signalez un souci.
          </template>
        </p>
      </div>
    </div>
  </div>

  <!-- Aucune trace, sur une facture pourtant émise : elle a été marquée
       « envoyée » à la main. Le dire évite de chercher un email inexistant. -->
  <p
    v-else-if="statut !== 'brouillon' && statut !== 'annulee'"
    class="px-1 text-[12px] leading-snug text-[var(--text-tertiary)]"
  >
    Aucun envoi par email depuis APIGO — cette facture a été marquée « envoyée » à la main.
  </p>
</template>

<script setup lang="ts">
/**
 * LA TRACE D'ENVOI D'UNE FACTURE.
 *
 * ⚠️ CE COMPOSANT EXISTE PARCE QUE L'ÉCRAN MENTAIT. `sendFactureAuClient`
 * rendait `true` sans condition — le SDK Resend ne lève jamais d'exception, il
 * rend `{ data, error }` — et la page affichait « Facture envoyée à … » dès que
 * la requête revenait. Domaine non vérifié, adresse rejetée, quota dépassé :
 * l'apiculteur voyait un succès, le numéro légal était gravé, et le client
 * n'avait rien reçu.
 *
 * La notification qui suit le clic ne dit donc plus que « c'est parti » ; c'est
 * cette carte, nourrie par les colonnes `email_*` de `transactions`, qui porte
 * la vérité — y compris après un rechargement de page, des jours plus tard.
 */
const props = defineProps<{
  statut: string;
  clientEmail?: string | null;
  envoyeLe?: string | Date | null;
  messageId?: string | null;
  dernierEchec?: string | null;
}>();

const quand = computed(() => {
  if (!props.envoyeLe) return '';
  const d = new Date(props.envoyeLe);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>
