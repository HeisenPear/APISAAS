<template>
  <div>
    <UButton
      label="Synchroniser"
      icon="i-lucide-calendar-sync"
      color="neutral"
      variant="outline"
      size="sm"
      @click="open"
    />

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="isOpen = false"
      >
        <div class="w-full max-w-md rounded-[18px] bg-white p-6 shadow-xl">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                Synchroniser le calendrier
              </h2>
              <p class="mt-1 text-[13px] text-[var(--text-secondary)]">
                Retrouvez interventions, récoltes et traitements dans Google ou Apple Calendar.
              </p>
            </div>
            <button
              class="rounded-lg p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)]"
              @click="isOpen = false"
            >
              <UIcon name="i-lucide-x" class="h-5 w-5" />
            </button>
          </div>

          <!-- Gating -->
          <div
            v-if="!gating.can('syncIcal')"
            class="mt-5 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 text-center"
          >
            <p class="text-[13px] text-[var(--text-secondary)]">
              La synchronisation calendrier est disponible à partir du plan
              <strong>Starter</strong>.
            </p>
            <UButton
              to="/parametres/abonnement"
              label="Voir les offres"
              color="primary"
              size="sm"
              class="mt-3"
            />
          </div>

          <template v-else>
            <!-- Pas encore de lien -->
            <div v-if="!subUrl" class="mt-5">
              <UButton
                :loading="busy"
                label="Générer le lien de synchronisation"
                icon="i-lucide-link"
                color="primary"
                block
                @click="generer"
              />
            </div>

            <!-- Lien prêt -->
            <div v-else class="mt-5 space-y-4">
              <div>
                <p
                  class="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
                >
                  Lien d'abonnement
                </p>
                <div class="mt-1.5 flex gap-2">
                  <input
                    :value="subUrl"
                    readonly
                    class="h-9 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 text-[12px] text-[var(--text-secondary)]"
                    @focus="(e) => (e.target as HTMLInputElement).select()"
                  />
                  <UButton
                    :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                    :color="copied ? 'success' : 'neutral'"
                    variant="outline"
                    @click="copier"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <a
                  :href="googleUrl"
                  target="_blank"
                  rel="noopener"
                  class="flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-white text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                  Google Agenda
                </a>
                <a
                  :href="webcalUrl"
                  class="flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-white text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <UIcon name="i-lucide-apple" class="h-4 w-4" />
                  Apple Calendar
                </a>
              </div>

              <p class="text-[12px] leading-relaxed text-[var(--text-tertiary)]">
                Le calendrier <strong>« Apigo »</strong> apparaîtra en jaune et se met à jour
                automatiquement. Sur Apple, le clic ouvre la fenêtre d'abonnement ; sur Google,
                collez le lien dans « Autres agendas → À partir de l'URL ».
              </p>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const gating = useGating();
const notifications = useNotifications();

const isOpen = ref(false);
const busy = ref(false);
const copied = ref(false);
const token = ref<string | null>(null);
const origin = ref('');
const host = ref('');

const subUrl = computed(() =>
  token.value && origin.value ? `${origin.value}/api/calendrier/${token.value}.ics` : '',
);
const webcalUrl = computed(() =>
  token.value && host.value ? `webcal://${host.value}/api/calendrier/${token.value}.ics` : '',
);
const googleUrl = computed(() =>
  webcalUrl.value
    ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl.value)}`
    : '',
);

async function open() {
  isOpen.value = true;
  origin.value = window.location.origin;
  host.value = window.location.host;
  if (token.value || !gating.can('syncIcal')) return;
  try {
    const res = await $fetch<{ data: Array<{ token: string; actif: boolean }> }>(
      '/api/calendrier/tokens',
    );
    const active = res.data.find((t) => t.actif) ?? res.data[0];
    if (active) token.value = active.token;
  } catch {
    // pas de token existant — l'utilisateur en générera un
  }
}

async function generer() {
  busy.value = true;
  try {
    const res = await $fetch<{ data: { token: string } }>('/api/calendrier/tokens', {
      method: 'POST',
      body: { scope: 'all' },
    });
    token.value = res.data.token;
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la génération du lien'));
  } finally {
    busy.value = false;
  }
}

async function copier() {
  try {
    await navigator.clipboard.writeText(subUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1800);
  } catch {
    notifications.error('Copie impossible — sélectionnez et copiez le lien manuellement.');
  }
}
</script>
