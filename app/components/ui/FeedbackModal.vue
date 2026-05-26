<script setup lang="ts">
const open = useState<boolean>('feedback-modal', () => false);
const saving = ref(false);
const sent = ref(false);

const form = reactive({
  profilApicole: '' as string,
  nombreRuches: undefined as number | undefined,
  apprecie: '',
  frustre: '',
  nps: null as number | null,
  emailContact: '',
});

const profilOptions = [
  { value: 'loisir', label: '🏡 Loisir', sub: '1-10 ruches' },
  { value: 'pluri-actif', label: '🔀 Pluri-actif', sub: '10-50 ruches' },
  { value: 'professionnel', label: '🏢 Pro', sub: '50+ ruches' },
  { value: 'association', label: '🤝 Association' },
];

const npsOptions = Array.from({ length: 10 }, (_, i) => i + 1);

function npsColor(n: number, selected: boolean) {
  if (n <= 6)
    return selected
      ? 'bg-red-100 border-red-400 ring-2 ring-red-200 text-red-700'
      : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100';
  if (n <= 8)
    return selected
      ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-200 text-amber-700'
      : 'bg-amber-50 text-amber-500 border-amber-100 hover:bg-amber-100';
  return selected
    ? 'bg-green-100 border-green-400 ring-2 ring-green-200 text-green-700'
    : 'bg-green-50 text-green-500 border-green-100 hover:bg-green-100';
}

const canSubmit = computed(() => form.profilApicole && form.nps !== null);

const notifications = useNotifications();

async function submit() {
  if (!canSubmit.value) return;
  saving.value = true;
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        profilApicole: form.profilApicole,
        nombreRuches: form.nombreRuches,
        apprecie: form.apprecie || undefined,
        frustre: form.frustre || undefined,
        nps: form.nps,
        emailContact: form.emailContact || undefined,
        pageSource: window.location.pathname,
      },
    });
    sent.value = true;
  } catch {
    notifications.error("Erreur lors de l'envoi. Réessayez.");
  } finally {
    saving.value = false;
  }
}

function reset() {
  Object.assign(form, {
    profilApicole: '',
    nombreRuches: undefined,
    apprecie: '',
    frustre: '',
    nps: null,
    emailContact: '',
  });
  sent.value = false;
  open.value = false;
}
</script>

<template>
  <!-- Modal feedback (déclenchée depuis la sidebar via useState 'feedback-modal') -->
  <UModal v-model:open="open">
    <template #content>
      <div class="max-h-[85vh] overflow-y-auto p-6">
        <!-- ════════ ÉCRAN MERCI ════════ -->
        <div v-if="sent" class="py-10 text-center">
          <div
            class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
          >
            <UIcon name="i-lucide-check-circle" class="h-8 w-8 text-green-500" />
          </div>
          <h3 class="mb-2 text-xl font-bold text-stone-800">Merci pour votre retour !</h3>
          <p class="mb-8 text-sm leading-relaxed text-stone-500">
            Votre avis va directement nous aider à améliorer Apiculture 360°.
          </p>
          <UButton color="primary" @click="reset">Fermer</UButton>
        </div>

        <!-- ════════ FORMULAIRE ════════ -->
        <div v-else>
          <div class="mb-6">
            <h2 class="text-xl font-bold text-stone-800">Votre avis compte !</h2>
            <p class="mt-1 text-sm text-stone-500">2 minutes pour nous aider à progresser</p>
          </div>

          <!-- Q1 — Profil apicole -->
          <div class="mb-6">
            <label class="mb-2 block text-sm font-semibold text-stone-700">
              Votre profil apicole <span class="text-red-400">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in profilOptions"
                :key="opt.value"
                type="button"
                class="rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200"
                :class="
                  form.profilApicole === opt.value
                    ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-transparent bg-stone-50 text-stone-600 hover:bg-amber-50 hover:text-amber-700'
                "
                @click="form.profilApicole = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Q2 — Nombre de ruches -->
          <div class="mb-6">
            <label class="mb-2 block text-sm font-semibold text-stone-700">
              Nombre de ruches
            </label>
            <div class="flex items-center gap-3">
              <UInput
                v-model.number="form.nombreRuches"
                type="number"
                :min="0"
                :max="9999"
                placeholder="0"
                class="w-28"
              />
              <span class="text-sm text-stone-400">ruches</span>
            </div>
          </div>

          <div class="my-6 border-t border-stone-100" />

          <!-- Q3 — Apprécié -->
          <div class="mb-6">
            <label class="mb-1 block text-sm font-semibold text-stone-700">
              Ce que vous avez apprécié ✨
            </label>
            <p class="mb-2 text-xs text-stone-400">Interface, fonctionnalités, vitesse, design…</p>
            <UTextarea
              v-model="form.apprecie"
              placeholder="J'ai particulièrement aimé…"
              :rows="3"
              autoresize
            />
          </div>

          <!-- Q4 — Frustré -->
          <div class="mb-6">
            <label class="mb-1 block text-sm font-semibold text-stone-700">
              Ce qui vous a frustré ou manqué 🤔
            </label>
            <p class="mb-2 text-xs text-stone-400">Bugs, fonctionnalités absentes, UX confuse…</p>
            <UTextarea
              v-model="form.frustre"
              placeholder="Ce qui m'a gêné ou manqué…"
              :rows="3"
              autoresize
            />
          </div>

          <div class="my-6 border-t border-stone-100" />

          <!-- Q5 — NPS -->
          <div class="mb-6">
            <label class="mb-2 block text-sm font-semibold text-stone-700">
              Recommanderiez-vous Apiculture 360° ? <span class="text-red-400">*</span>
            </label>
            <div class="grid grid-cols-10 gap-1.5">
              <button
                v-for="n in npsOptions"
                :key="n"
                type="button"
                class="aspect-square cursor-pointer rounded-lg border-2 text-sm font-bold transition-all duration-150"
                :class="npsColor(n, form.nps === n)"
                @click="form.nps = n"
              >
                {{ n }}
              </button>
            </div>
            <div class="mt-2 flex justify-between text-xs text-stone-400">
              <span>Pas du tout</span>
              <span>Absolument !</span>
            </div>
          </div>

          <!-- Q6 — Email optionnel -->
          <div class="mb-8">
            <label class="mb-1 block text-sm font-semibold text-stone-700">
              Votre email
              <span class="font-normal text-stone-400">(optionnel)</span>
            </label>
            <p class="mb-2 text-xs text-stone-400">Pour qu'on puisse vous recontacter si besoin</p>
            <UInput v-model="form.emailContact" type="email" placeholder="votre@email.com" />
          </div>

          <!-- Submit -->
          <UButton
            block
            color="primary"
            size="lg"
            icon="i-lucide-send"
            :loading="saving"
            :disabled="!canSubmit || saving"
            @click="submit"
          >
            Envoyer mon avis
          </UButton>

          <p class="mt-3 text-center text-xs text-stone-400">
            Vos réponses sont confidentielles et nous aident à construire le meilleur outil
            possible.
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
