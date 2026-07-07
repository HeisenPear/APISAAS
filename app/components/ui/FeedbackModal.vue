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
      <div class="flex max-h-[92dvh] flex-col">
        <!-- ── Header sticky avec bouton fermer ────────────────── -->
        <div class="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p class="text-[16px] font-semibold text-stone-800">Votre avis</p>
            <p class="text-[12px] text-stone-400">2 min pour nous aider à progresser</p>
          </div>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Fermer"
            @click="reset"
          >
            <UIcon name="i-lucide-x" class="h-4.5 w-4.5" />
          </button>
        </div>

        <!-- ── Corps scrollable ────────────────────────────────── -->
        <div class="flex-1 overflow-y-auto px-5 py-5">
          <!-- ════════ ÉCRAN MERCI ════════ -->
          <div v-if="sent" class="py-8 text-center">
            <div
              class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
            >
              <UIcon name="i-lucide-check-circle" class="h-8 w-8 text-green-500" />
            </div>
            <h3 class="mb-2 text-xl font-bold text-stone-800">Merci pour votre retour !</h3>
            <p class="mb-8 text-sm leading-relaxed text-stone-500">
              Votre avis va directement nous aider à améliorer APIGO.
            </p>
            <UButton color="primary" @click="reset">Fermer</UButton>
          </div>

          <!-- ════════ FORMULAIRE ════════ -->
          <div v-else class="space-y-6">
            <!-- Q1 — Profil apicole -->
            <div>
              <label class="mb-2 block text-[13px] font-semibold text-stone-700">
                Votre profil apicole <span class="text-red-400">*</span>
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in profilOptions"
                  :key="opt.value"
                  type="button"
                  class="min-h-[44px] rounded-full border-2 px-4 py-2 text-[13px] font-medium transition-all duration-200"
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
            <div>
              <label class="mb-2 block text-[13px] font-semibold text-stone-700"
                >Nombre de ruches</label
              >
              <div class="flex items-center gap-3">
                <UInput
                  v-model.number="form.nombreRuches"
                  type="number"
                  :min="0"
                  :max="9999"
                  placeholder="0"
                  class="w-28"
                />
                <span class="text-[13px] text-stone-400">ruches</span>
              </div>
            </div>

            <div class="border-t border-stone-100" />

            <!-- Q3 — Apprécié -->
            <div>
              <label class="mb-1 block text-[13px] font-semibold text-stone-700"
                >Ce que vous avez apprécié ✨</label
              >
              <p class="mb-2 text-[12px] text-stone-400">
                Interface, fonctionnalités, vitesse, design…
              </p>
              <UTextarea
                v-model="form.apprecie"
                placeholder="J'ai particulièrement aimé…"
                :rows="3"
                autoresize
              />
            </div>

            <!-- Q4 — Frustré -->
            <div>
              <label class="mb-1 block text-[13px] font-semibold text-stone-700"
                >Ce qui vous a frustré ou manqué 🤔</label
              >
              <p class="mb-2 text-[12px] text-stone-400">
                Bugs, fonctionnalités absentes, UX confuse…
              </p>
              <UTextarea
                v-model="form.frustre"
                placeholder="Ce qui m'a gêné ou manqué…"
                :rows="3"
                autoresize
              />
            </div>

            <div class="border-t border-stone-100" />

            <!-- Q5 — NPS -->
            <div>
              <label class="mb-3 block text-[13px] font-semibold text-stone-700">
                Recommanderiez-vous APIGO ? <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-1">
                <button
                  v-for="n in npsOptions"
                  :key="n"
                  type="button"
                  class="aspect-square min-h-[44px] cursor-pointer rounded-lg border-2 text-[13px] font-bold transition-all duration-150 sm:min-h-[36px]"
                  :class="npsColor(n, form.nps === n)"
                  @click="form.nps = n"
                >
                  {{ n }}
                </button>
              </div>
              <div class="mt-2 flex justify-between text-[11px] text-stone-400">
                <span>Pas du tout</span>
                <span>Absolument !</span>
              </div>
            </div>

            <!-- Q6 — Email optionnel -->
            <div>
              <label class="mb-1 block text-[13px] font-semibold text-stone-700">
                Votre email <span class="font-normal text-stone-400">(optionnel)</span>
              </label>
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

            <p class="pb-2 text-center text-[11px] text-stone-400">
              Vos réponses sont confidentielles.
            </p>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
