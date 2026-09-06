<script setup lang="ts">
import { useCatalogueProduits, type ProduitCatalogue } from '~/composables/useCatalogueProduits';
import { TYPES_PRODUIT } from '~/types/enums';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [boolean]; select: [ProduitCatalogue]; libre: [] }>();

const toast = useToast();
const { list, create, update, remove } = useCatalogueProduits();

const items = ref<ProduitCatalogue[]>([]);
const loading = ref(false);
const search = ref('');
const editing = ref(false);
const editId = ref<string | null>(null);
const saving = ref(false);

const isOpen = computed({ get: () => props.open, set: (v) => emit('update:open', v) });

const form = reactive({
  nom: '',
  groupe: '',
  categorie: 'autre',
  categorieVente: 'autre' as string | null,
  tauxTva: 20,
  uniteTypique: '',
  modePrix: 'format' as 'format' | 'poids',
  contenance: null as number | null,
  uniteContenance: '',
  icon: '📦',
});

const uniteContenanceOptions = [
  { label: '—', value: '' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'L', value: 'L' },
];

// Options de type (réutilise la taxonomie produit) : auto-remplit catégorie + TVA.
const typeOptions = TYPES_PRODUIT.flatMap((g) =>
  g.items.map((it) => ({
    label: `${g.group} · ${it.label}`,
    value: `${it.value}|${it.catStock}|${it.tva}`,
  })),
);
const typeValue = ref('');
function onType(v: string) {
  const [cv, cat, tva] = v.split('|');
  form.categorieVente = cv ?? 'autre';
  form.categorie = cat ?? 'autre';
  form.tauxTva = Number(tva ?? 20);
}

const modePrixOptions = [
  { label: 'Au format (× prix)', value: 'format' },
  { label: 'Au poids (× contenance × prix)', value: 'poids' },
];

async function load() {
  loading.value = true;
  try {
    items.value = await list();
  } finally {
    loading.value = false;
  }
}
watch(
  () => props.open,
  (v) => {
    if (v) {
      editing.value = false;
      load();
    }
  },
);

const grouped = computed(() => {
  const q = search.value.trim().toLowerCase();
  const filtered = q
    ? items.value.filter(
        (p) => p.nom.toLowerCase().includes(q) || (p.groupe ?? '').toLowerCase().includes(q),
      )
    : items.value;
  const map = new Map<string, ProduitCatalogue[]>();
  for (const p of filtered) {
    const g = p.groupe ?? 'Autres';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(p);
  }
  return [...map.entries()].map(([groupe, produits]) => ({ groupe, produits }));
});

function choisir(p: ProduitCatalogue) {
  emit('select', p);
  isOpen.value = false;
}
function produitLibre() {
  emit('libre');
  isOpen.value = false;
}

async function supprimer(p: ProduitCatalogue) {
  if (!confirm(`Retirer « ${p.nom} » du catalogue ?`)) return;
  try {
    await remove(p.id);
    items.value = items.value.filter((x) => x.id !== p.id);
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la suppression'), color: 'error' });
  }
}

function nouveau() {
  editId.value = null;
  Object.assign(form, {
    nom: '',
    groupe: '',
    categorie: 'autre',
    categorieVente: 'autre',
    tauxTva: 20,
    uniteTypique: '',
    modePrix: 'format',
    contenance: null,
    uniteContenance: '',
    icon: '📦',
  });
  typeValue.value = '';
  editing.value = true;
}
function modifier(p: ProduitCatalogue) {
  editId.value = p.id;
  Object.assign(form, {
    nom: p.nom,
    groupe: p.groupe ?? '',
    categorie: p.categorie,
    categorieVente: p.categorieVente ?? 'autre',
    tauxTva: p.tauxTva ? Number(p.tauxTva) : 20,
    uniteTypique: p.uniteTypique ?? '',
    modePrix: p.modePrix,
    contenance: p.contenance != null ? Number(p.contenance) : null,
    uniteContenance: p.uniteContenance ?? '',
    icon: p.icon ?? '📦',
  });
  typeValue.value = '';
  editing.value = true;
}

async function enregistrer() {
  if (!form.nom.trim()) return;
  saving.value = true;
  try {
    const body = {
      ...form,
      contenance: form.contenance || null,
      uniteContenance: form.uniteContenance || null,
    };
    if (editId.value) {
      const up = await update(editId.value, body);
      items.value = items.value.map((x) => (x.id === editId.value ? up : x));
    } else {
      items.value.push(await create(body));
    }
    editing.value = false;
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, "Erreur lors de l'enregistrement"), color: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Catalogue de produits" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <!-- Liste / navigateur -->
      <div v-if="!editing" class="space-y-4">
        <div class="flex items-center gap-2">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Rechercher un produit…"
            class="flex-1"
          />
          <UButton icon="i-lucide-plus" variant="soft" color="primary" @click="nouveau">
            Preset
          </UButton>
        </div>

        <p class="text-[12.5px] text-[var(--text-secondary)]">
          Choisissez un produit : le formulaire se pré-remplit, il ne reste qu'à saisir la quantité
          et le prix.
        </p>

        <div v-if="loading" class="space-y-2">
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
          />
        </div>

        <div v-else class="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
          <div v-for="g in grouped" :key="g.groupe">
            <p
              class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--honey-deep)]"
            >
              {{ g.groupe }}
            </p>
            <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <div
                v-for="p in g.produits"
                :key="p.id"
                class="group flex items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2 transition-colors hover:border-[var(--honey)]"
              >
                <button class="flex flex-1 items-center gap-2 text-left" @click="choisir(p)">
                  <span class="text-[16px]">{{ p.icon ?? '📦' }}</span>
                  <span class="min-w-0">
                    <span class="block truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {{ p.nom }}
                    </span>
                    <span class="block text-[11px] text-[var(--text-tertiary)]">
                      {{ p.uniteTypique || '—' }} · TVA {{ p.tauxTva ?? '—' }}%<template
                        v-if="p.contenance"
                      >
                        · {{ Number(p.contenance) }} {{ p.uniteContenance || 'kg' }}</template
                      >
                    </span>
                  </span>
                </button>
                <button
                  class="shrink-0 rounded-[6px] p-1 text-[var(--text-tertiary)] opacity-0 transition hover:bg-[var(--surface-muted)] group-hover:opacity-100"
                  title="Modifier"
                  @click="modifier(p)"
                >
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
                </button>
                <button
                  class="shrink-0 rounded-[6px] p-1 text-[var(--text-tertiary)] opacity-0 transition hover:bg-red-50 hover:text-[var(--status-bad)] group-hover:opacity-100"
                  title="Retirer"
                  @click="supprimer(p)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between border-t border-[var(--border-default)] pt-3">
          <UButton variant="ghost" color="neutral" @click="produitLibre">
            Créer un produit libre →
          </UButton>
        </div>
      </div>

      <!-- Édition / création d'un preset -->
      <div v-else class="space-y-3">
        <UFormField label="Type de produit (pré-remplit catégorie & TVA)">
          <USelect
            v-model="typeValue"
            :items="typeOptions"
            value-key="value"
            label-key="label"
            placeholder="Choisir un type…"
            @update:model-value="onType"
          />
        </UFormField>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Nom">
            <UInput v-model="form.nom" placeholder="Ex : Pollen frais" />
          </UFormField>
          <UFormField label="Groupe">
            <UInput v-model="form.groupe" placeholder="Ex : Produits de la ruche" />
          </UFormField>
          <UFormField label="Unité typique">
            <UInput v-model="form.uniteTypique" placeholder="pots, kg, L…" />
          </UFormField>
          <UFormField label="Icône">
            <UInput v-model="form.icon" placeholder="📦" />
          </UFormField>
          <UFormField label="TVA (%)">
            <UInput v-model.number="form.tauxTva" type="number" :step="0.5" />
          </UFormField>
          <UFormField label="Mode de prix">
            <USelect
              v-model="form.modePrix"
              :items="modePrixOptions"
              value-key="value"
              label-key="label"
            />
          </UFormField>
          <UFormField label="Contenance (poids unitaire)">
            <UInput
              v-model.number="form.contenance"
              type="number"
              :step="0.001"
              :min="0"
              placeholder="Ex : 300"
            />
          </UFormField>
          <UFormField label="Unité de contenance">
            <USelect
              v-model="form.uniteContenance"
              :items="uniteContenanceOptions"
              value-key="value"
              label-key="label"
            />
          </UFormField>
        </div>
        <p class="text-[11.5px] text-[var(--text-tertiary)]">
          Renseignez la contenance pour qu'un conditionnement (ex : fût 300 kg) soit proposé dans le
          formulaire miel et valorisé au bon poids.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <template v-if="editing">
          <UButton color="neutral" variant="outline" @click="editing = false">Retour</UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.nom.trim()"
            @click="enregistrer"
          >
            {{ editId ? 'Enregistrer' : 'Ajouter au catalogue' }}
          </UButton>
        </template>
        <UButton v-else color="neutral" variant="outline" @click="isOpen = false">Fermer</UButton>
      </div>
    </template>
  </UModal>
</template>
