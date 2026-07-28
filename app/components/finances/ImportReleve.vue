<script setup lang="ts">
import { useBanque } from '~/composables/useBanque';

const emit = defineEmits<{ imported: [] }>();

const toast = useToast();
const { importReleve, importRelevePdf } = useBanque();
const input = ref<HTMLInputElement | null>(null);
const loading = ref(false);

/** Au-delà, ce n'est plus un relevé : on arrête avant l'aller-retour réseau. */
const TAILLE_MAX = 6 * 1024 * 1024;

function choisir() {
  input.value?.click();
}

/**
 * Un PDF est un BINAIRE : `file.text()` le mutilerait. On le transporte donc en
 * base64. `FileReader` plutôt qu'une boucle sur les octets — sur un relevé de
 * plusieurs centaines de kilo-octets, `String.fromCharCode(...tableau)` fait
 * sauter la pile d'appels.
 */
function enBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const res = String(lecteur.result);
      // Le résultat est une URL de données : « data:application/pdf;base64,XXXX ».
      resolve(res.slice(res.indexOf(',') + 1));
    };
    lecteur.onerror = () => reject(new Error('Fichier illisible'));
    lecteur.readAsDataURL(file);
  });
}

async function onFichier(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.size > TAILLE_MAX) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: 'Un relevé bancaire dépasse rarement quelques centaines de Ko.',
      color: 'warning',
    });
    if (input.value) input.value.value = '';
    return;
  }

  const estPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  loading.value = true;
  try {
    const res = estPdf
      ? await importRelevePdf(await enBase64(file), file.name)
      : await importReleve(await file.text(), file.name);

    if (!res || res.importes === 0) {
      toast.add({
        title: res?.doublons
          ? 'Relevé déjà importé (aucun nouveau mouvement)'
          : 'Aucun mouvement lisible dans ce fichier',
        // Sur un PDF, « rien trouvé » a une cause précise et une porte de
        // sortie : on la donne plutôt que de laisser l'apiculteur réessayer.
        description:
          estPdf && !res?.doublons
            ? 'La mise en page de ce relevé n’a pas pu être reconstituée. L’export CSV ou OFX de votre banque contient les mêmes opérations, sans ambiguïté.'
            : undefined,
        color: 'warning',
      });
    } else {
      toast.add({
        title: `${res.importes} mouvement${res.importes > 1 ? 's' : ''} importé${res.importes > 1 ? 's' : ''}`,
        description:
          [
            res.doublons ? `${res.doublons} doublon(s) ignoré(s)` : '',
            // Sur un PDF, les lignes écartées le sont parce que le sens de
            // l'argent n'était pas déterminable — on le dit, c'est une invitation
            // à vérifier, pas un détail technique.
            res.ignorees
              ? `${res.ignorees} ligne(s) non lue(s)${estPdf ? ' — à vérifier sur le relevé' : ''}`
              : '',
          ]
            .filter(Boolean)
            .join(' · ') || undefined,
        color: 'success',
      });
      emit('imported');
    }
  } catch (err) {
    toast.add({ title: getApiErrorMessage(err, "Échec de l'import"), color: 'error' });
  } finally {
    loading.value = false;
    if (input.value) input.value.value = '';
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-6 py-8 text-center"
  >
    <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--honey-soft)]">
      <UIcon name="i-lucide-upload" class="h-5 w-5 text-[var(--honey-deep)]" />
    </div>
    <div>
      <p class="text-sm font-medium text-[var(--text-primary)]">Importer un relevé bancaire</p>
      <p class="mt-1 text-xs text-[var(--text-tertiary)]">
        Fichier CSV, OFX ou PDF exporté depuis votre banque — vos identifiants ne quittent jamais
        votre banque.
      </p>
      <!-- Dit d'avance ce que le PDF a de moins fiable, plutôt que de le
           découvrir après coup : un relevé scanné n'est qu'une image, il ne
           contient aucun texte à lire. -->
      <p class="mt-1.5 text-[11px] text-[var(--text-quaternary)]">
        Le CSV et l’OFX restent les plus fiables. Un PDF scanné (photo ou image) ne peut pas être
        lu.
      </p>
    </div>
    <UButton :loading="loading" color="primary" variant="soft" @click="choisir">
      Choisir un fichier
    </UButton>
    <input
      ref="input"
      type="file"
      accept=".csv,.ofx,.txt,.pdf,text/csv,application/pdf"
      class="hidden"
      @change="onFichier"
    />
  </div>
</template>
