<template>
  <div class="cine-chips">
    <button
      v-for="(m, i) in MODULES"
      :key="m.id"
      class="cine-mod"
      :class="{ 'is-sel': modele.includes(m.id) }"
      :style="cascade(i, 0.2, 0.11)"
      type="button"
      @click.stop="basculer(m.id)"
    >
      <UIcon :name="m.icone" class="cine-mod-ico" />
      <span class="cine-mod-t">{{ m.titre }}</span>
      <span class="cine-mod-v">{{ modele.includes(m.id) ? 'Activé' : 'Ajouter' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Scène « modules » — pré-cochés selon le profil, ajustables au tap.
 *
 * On garde cet écran plutôt que d'appliquer les recommandations en silence :
 * l'apiculteur doit VOIR ce qu'on a décidé pour lui et pouvoir le défaire.
 * C'est le fondamental « automatisme visible et corrigeable ».
 */
const modele = defineModel<string[]>({ required: true });
const props = defineProps<{ profil: 'loisir' | 'professionnel' | 'pluri_actif' }>();

const MODULES = [
  { id: 'interventions', icone: 'i-lucide-clipboard-check', titre: 'Suivi des visites' },
  { id: 'production', icone: 'i-lucide-package', titre: 'Récolte & production' },
  { id: 'stocks', icone: 'i-lucide-boxes', titre: 'Stocks' },
  { id: 'finances', icone: 'i-lucide-euro', titre: 'Finances' },
  { id: 'clients', icone: 'i-lucide-users', titre: 'Clients & ventes' },
  { id: 'transhumance', icone: 'i-lucide-truck', titre: 'Transhumance' },
];

/** Ce qui a du sens par pratique — repris de l'onboarding actuel. */
const RECOMMANDES: Record<string, string[]> = {
  loisir: ['interventions', 'production'],
  pluri_actif: ['interventions', 'production', 'stocks'],
  professionnel: ['interventions', 'production', 'stocks', 'finances', 'clients'],
};

function basculer(id: string) {
  modele.value = modele.value.includes(id)
    ? modele.value.filter((m) => m !== id)
    : [...modele.value, id];
}

// Pré-cochage à l'entrée dans la scène, une seule fois : si l'apiculteur a déjà
// touché aux modules, on ne réécrit pas son choix par-dessus.
onMounted(() => {
  if (modele.value.length === 0) modele.value = [...(RECOMMANDES[props.profil] ?? [])];
});
</script>
